# BlackRoad OS - CRDT Implementations
# Conflict-free Replicated Data Types for 30K collaboration
#
# @blackroad_name: CRDT Engine
# @operator: alexa.operator.v1

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Generic, List, Optional, Set, Tuple, TypeVar
from uuid import uuid4
import time

from .vector_clock import VectorClock

T = TypeVar("T")


class CRDT(ABC, Generic[T]):
    """Base class for all CRDT types."""

    @abstractmethod
    def value(self) -> T:
        """Get the current value."""
        pass

    @abstractmethod
    def merge(self, other: CRDT[T]) -> CRDT[T]:
        """Merge with another CRDT of the same type."""
        pass

    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        pass

    @classmethod
    @abstractmethod
    def from_dict(cls, data: Dict[str, Any]) -> CRDT[T]:
        """Deserialize from dictionary."""
        pass


@dataclass
class LWWRegister(CRDT[T]):
    """Last-Write-Wins Register.

    Uses timestamps for conflict resolution. The write with the
    highest timestamp wins. Ties broken by node_id.
    """

    _value: T
    timestamp: float = field(default_factory=time.time)
    node_id: str = field(default_factory=lambda: str(uuid4()))

    def value(self) -> T:
        return self._value

    def set(self, new_value: T, timestamp: Optional[float] = None) -> LWWRegister[T]:
        """Set a new value with optional timestamp."""
        ts = timestamp if timestamp is not None else time.time()
        return LWWRegister(
            _value=new_value,
            timestamp=ts,
            node_id=self.node_id,
        )

    def merge(self, other: LWWRegister[T]) -> LWWRegister[T]:
        """Merge with another LWW register."""
        if other.timestamp > self.timestamp:
            return other
        elif other.timestamp == self.timestamp:
            # Tie-break by node_id (lexicographic)
            if other.node_id > self.node_id:
                return other
        return self

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "lww_register",
            "value": self._value,
            "timestamp": self.timestamp,
            "node_id": self.node_id,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> LWWRegister:
        return cls(
            _value=data["value"],
            timestamp=data["timestamp"],
            node_id=data["node_id"],
        )


@dataclass
class GCounter(CRDT[int]):
    """Grow-only Counter.

    Each node maintains its own count. The total is the sum of all counts.
    Only supports increment operations.
    """

    counts: Dict[str, int] = field(default_factory=dict)
    node_id: str = field(default_factory=lambda: str(uuid4()))

    def value(self) -> int:
        return sum(self.counts.values())

    def increment(self, amount: int = 1) -> GCounter:
        """Increment the counter."""
        if amount < 0:
            raise ValueError("GCounter only supports positive increments")
        new_counts = self.counts.copy()
        new_counts[self.node_id] = new_counts.get(self.node_id, 0) + amount
        return GCounter(counts=new_counts, node_id=self.node_id)

    def merge(self, other: GCounter) -> GCounter:
        """Merge with another G-Counter."""
        new_counts = self.counts.copy()
        for node, count in other.counts.items():
            new_counts[node] = max(new_counts.get(node, 0), count)
        return GCounter(counts=new_counts, node_id=self.node_id)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "g_counter",
            "counts": self.counts,
            "node_id": self.node_id,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> GCounter:
        return cls(counts=data["counts"], node_id=data["node_id"])


@dataclass
class PNCounter(CRDT[int]):
    """Positive-Negative Counter.

    Supports both increment and decrement by using two G-Counters.
    """

    positive: GCounter = field(default_factory=GCounter)
    negative: GCounter = field(default_factory=GCounter)

    def value(self) -> int:
        return self.positive.value() - self.negative.value()

    def increment(self, amount: int = 1) -> PNCounter:
        """Increment the counter."""
        return PNCounter(
            positive=self.positive.increment(amount),
            negative=self.negative,
        )

    def decrement(self, amount: int = 1) -> PNCounter:
        """Decrement the counter."""
        return PNCounter(
            positive=self.positive,
            negative=self.negative.increment(amount),
        )

    def merge(self, other: PNCounter) -> PNCounter:
        """Merge with another PN-Counter."""
        return PNCounter(
            positive=self.positive.merge(other.positive),
            negative=self.negative.merge(other.negative),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "pn_counter",
            "positive": self.positive.to_dict(),
            "negative": self.negative.to_dict(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> PNCounter:
        return cls(
            positive=GCounter.from_dict(data["positive"]),
            negative=GCounter.from_dict(data["negative"]),
        )


@dataclass
class ORSet(CRDT[Set[T]]):
    """Observed-Remove Set.

    Supports add and remove operations. Uses unique tags to track
    additions, allowing removes to only affect observed adds.
    """

    # Map from element to set of (tag, added) pairs
    # added=True means the element is present, added=False means removed
    elements: Dict[Any, Set[Tuple[str, bool]]] = field(default_factory=dict)
    node_id: str = field(default_factory=lambda: str(uuid4()))

    def value(self) -> Set[T]:
        """Get all elements currently in the set."""
        result = set()
        for elem, tags in self.elements.items():
            # Element is in set if any tag is added (True)
            if any(added for _, added in tags):
                result.add(elem)
        return result

    def add(self, element: T) -> ORSet[T]:
        """Add an element to the set."""
        new_elements = {k: v.copy() for k, v in self.elements.items()}
        tag = f"{self.node_id}:{uuid4()}"
        if element not in new_elements:
            new_elements[element] = set()
        new_elements[element].add((tag, True))
        return ORSet(elements=new_elements, node_id=self.node_id)

    def remove(self, element: T) -> ORSet[T]:
        """Remove an element from the set."""
        if element not in self.elements:
            return self
        new_elements = {k: v.copy() for k, v in self.elements.items()}
        # Mark all observed tags as removed
        new_elements[element] = {(tag, False) for tag, _ in new_elements[element]}
        return ORSet(elements=new_elements, node_id=self.node_id)

    def contains(self, element: T) -> bool:
        """Check if element is in the set."""
        return element in self.value()

    def merge(self, other: ORSet[T]) -> ORSet[T]:
        """Merge with another OR-Set."""
        new_elements = {k: v.copy() for k, v in self.elements.items()}
        for elem, tags in other.elements.items():
            if elem not in new_elements:
                new_elements[elem] = set()
            for tag, added in tags:
                # Check if this tag exists
                existing = [t for t, _ in new_elements[elem] if t == tag]
                if not existing:
                    new_elements[elem].add((tag, added))
                else:
                    # Tag exists, keep removed state if either is removed
                    current_added = any(a for t, a in new_elements[elem] if t == tag)
                    new_added = added and current_added
                    new_elements[elem] = {
                        (t, a if t != tag else new_added)
                        for t, a in new_elements[elem]
                    }
        return ORSet(elements=new_elements, node_id=self.node_id)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "or_set",
            "elements": {
                str(k): [(t, a) for t, a in v]
                for k, v in self.elements.items()
            },
            "node_id": self.node_id,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> ORSet:
        elements = {
            k: {(t, a) for t, a in v}
            for k, v in data["elements"].items()
        }
        return cls(elements=elements, node_id=data["node_id"])


@dataclass
class RGANode:
    """Node in an RGA (Replicated Growable Array)."""

    id: str  # Unique identifier (timestamp:node_id)
    value: Optional[Any]  # None means tombstone (deleted)
    timestamp: float
    node_id: str

    def __lt__(self, other: RGANode) -> bool:
        """Compare by timestamp, then node_id for total ordering."""
        if self.timestamp != other.timestamp:
            return self.timestamp < other.timestamp
        return self.node_id < other.node_id


@dataclass
class RGA(CRDT[List[Any]]):
    """Replicated Growable Array.

    A list CRDT that supports insert and delete at any position.
    Uses unique IDs and timestamps for conflict-free ordering.
    """

    nodes: List[RGANode] = field(default_factory=list)
    node_id: str = field(default_factory=lambda: str(uuid4()))
    vector_clock: VectorClock = field(default_factory=VectorClock)

    def value(self) -> List[Any]:
        """Get the current list value (excluding tombstones)."""
        return [n.value for n in self.nodes if n.value is not None]

    def insert(self, index: int, value: Any) -> RGA:
        """Insert a value at the given index."""
        ts = time.time()
        new_id = f"{ts}:{self.node_id}"

        new_node = RGANode(
            id=new_id,
            value=value,
            timestamp=ts,
            node_id=self.node_id,
        )

        new_nodes = self.nodes.copy()

        # Find the actual position accounting for tombstones
        actual_pos = 0
        visible_count = 0
        for i, n in enumerate(new_nodes):
            if visible_count == index:
                actual_pos = i
                break
            if n.value is not None:
                visible_count += 1
            actual_pos = i + 1

        new_nodes.insert(actual_pos, new_node)

        return RGA(
            nodes=new_nodes,
            node_id=self.node_id,
            vector_clock=self.vector_clock.increment(self.node_id),
        )

    def delete(self, index: int) -> RGA:
        """Delete the value at the given index (tombstone)."""
        new_nodes = self.nodes.copy()

        # Find the actual position accounting for tombstones
        visible_count = 0
        for i, n in enumerate(new_nodes):
            if n.value is not None:
                if visible_count == index:
                    # Create tombstone
                    new_nodes[i] = RGANode(
                        id=n.id,
                        value=None,
                        timestamp=n.timestamp,
                        node_id=n.node_id,
                    )
                    break
                visible_count += 1

        return RGA(
            nodes=new_nodes,
            node_id=self.node_id,
            vector_clock=self.vector_clock.increment(self.node_id),
        )

    def insert_after(self, after_id: Optional[str], value: Any) -> RGA:
        """Insert after a specific node ID (for OT integration)."""
        ts = time.time()
        new_id = f"{ts}:{self.node_id}"

        new_node = RGANode(
            id=new_id,
            value=value,
            timestamp=ts,
            node_id=self.node_id,
        )

        new_nodes = self.nodes.copy()

        if after_id is None:
            # Insert at beginning
            new_nodes.insert(0, new_node)
        else:
            # Find the position after the given ID
            for i, n in enumerate(new_nodes):
                if n.id == after_id:
                    new_nodes.insert(i + 1, new_node)
                    break

        return RGA(
            nodes=new_nodes,
            node_id=self.node_id,
            vector_clock=self.vector_clock.increment(self.node_id),
        )

    def merge(self, other: RGA) -> RGA:
        """Merge with another RGA."""
        # Collect all unique nodes
        all_nodes: Dict[str, RGANode] = {}

        for n in self.nodes:
            if n.id not in all_nodes or (n.value is None and all_nodes[n.id].value is not None):
                # Keep tombstone if either has it
                all_nodes[n.id] = n

        for n in other.nodes:
            if n.id not in all_nodes:
                all_nodes[n.id] = n
            elif n.value is None and all_nodes[n.id].value is not None:
                # Tombstone wins
                all_nodes[n.id] = n

        # Sort by timestamp, then node_id for deterministic ordering
        sorted_nodes = sorted(all_nodes.values())

        return RGA(
            nodes=sorted_nodes,
            node_id=self.node_id,
            vector_clock=self.vector_clock.merge(other.vector_clock),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "rga",
            "nodes": [
                {
                    "id": n.id,
                    "value": n.value,
                    "timestamp": n.timestamp,
                    "node_id": n.node_id,
                }
                for n in self.nodes
            ],
            "node_id": self.node_id,
            "vector_clock": self.vector_clock.to_dict(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> RGA:
        nodes = [
            RGANode(
                id=n["id"],
                value=n["value"],
                timestamp=n["timestamp"],
                node_id=n["node_id"],
            )
            for n in data["nodes"]
        ]
        return cls(
            nodes=nodes,
            node_id=data["node_id"],
            vector_clock=VectorClock.from_dict(data["vector_clock"]),
        )

    def __len__(self) -> int:
        return len(self.value())
