# BlackRoad OS - Vector Store
# Semantic search with pgvector and in-memory fallback
#
# @blackroad_name: Vector Store
# @operator: alexa.operator.v1

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4
import math

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None


@dataclass
class VectorSearchResult:
    """Result from vector similarity search."""

    id: str
    content: str
    metadata: Dict[str, Any]
    score: float  # Similarity score (0-1)
    embedding: Optional[List[float]] = None


@dataclass
class VectorEntry:
    """A vector entry in the store."""

    id: str
    content: str
    embedding: List[float]
    metadata: Dict[str, Any] = field(default_factory=dict)


class VectorStore(ABC):
    """Abstract base class for vector stores."""

    @abstractmethod
    async def add(
        self,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        id: Optional[str] = None,
    ) -> str:
        """Add a vector to the store."""
        pass

    @abstractmethod
    async def add_batch(
        self,
        entries: List[Tuple[str, List[float], Optional[Dict[str, Any]]]],
    ) -> List[str]:
        """Add multiple vectors to the store."""
        pass

    @abstractmethod
    async def search(
        self,
        query_embedding: List[float],
        k: int = 10,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        """Search for similar vectors."""
        pass

    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Delete a vector from the store."""
        pass

    @abstractmethod
    async def get(self, id: str) -> Optional[VectorEntry]:
        """Get a vector by ID."""
        pass


class InMemoryVectorStore(VectorStore):
    """In-memory vector store for development/testing.

    Uses cosine similarity for search.
    """

    def __init__(self, dimension: int = 1536):
        self.dimension = dimension
        self.entries: Dict[str, VectorEntry] = {}

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if HAS_NUMPY:
            a_arr = np.array(a)
            b_arr = np.array(b)
            return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr)))
        else:
            # Pure Python fallback
            dot = sum(x * y for x, y in zip(a, b))
            norm_a = math.sqrt(sum(x * x for x in a))
            norm_b = math.sqrt(sum(x * x for x in b))
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return dot / (norm_a * norm_b)

    async def add(
        self,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        id: Optional[str] = None,
    ) -> str:
        """Add a vector to the store."""
        entry_id = id or str(uuid4())
        self.entries[entry_id] = VectorEntry(
            id=entry_id,
            content=content,
            embedding=embedding,
            metadata=metadata or {},
        )
        return entry_id

    async def add_batch(
        self,
        entries: List[Tuple[str, List[float], Optional[Dict[str, Any]]]],
    ) -> List[str]:
        """Add multiple vectors to the store."""
        ids = []
        for content, embedding, metadata in entries:
            entry_id = await self.add(content, embedding, metadata)
            ids.append(entry_id)
        return ids

    async def search(
        self,
        query_embedding: List[float],
        k: int = 10,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        """Search for similar vectors."""
        results = []

        for entry in self.entries.values():
            # Apply filter
            if filter:
                match = True
                for key, value in filter.items():
                    if entry.metadata.get(key) != value:
                        match = False
                        break
                if not match:
                    continue

            # Compute similarity
            score = self._cosine_similarity(query_embedding, entry.embedding)

            results.append(VectorSearchResult(
                id=entry.id,
                content=entry.content,
                metadata=entry.metadata,
                score=score,
            ))

        # Sort by score descending
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:k]

    async def delete(self, id: str) -> bool:
        """Delete a vector from the store."""
        if id in self.entries:
            del self.entries[id]
            return True
        return False

    async def get(self, id: str) -> Optional[VectorEntry]:
        """Get a vector by ID."""
        return self.entries.get(id)

    def __len__(self) -> int:
        return len(self.entries)


class PgVectorStore(VectorStore):
    """PostgreSQL vector store using pgvector extension."""

    def __init__(
        self,
        table_name: str = "vectors",
        dimension: int = 1536,
        database=None,
    ):
        self.table_name = table_name
        self.dimension = dimension
        self._database = database

    async def _get_db(self):
        if self._database is None:
            from .postgres import get_database
            self._database = await get_database()
        return self._database

    async def initialize(self) -> None:
        """Initialize the vector store (create tables)."""
        db = await self._get_db()
        await db.execute(f"""
            CREATE EXTENSION IF NOT EXISTS vector;

            CREATE TABLE IF NOT EXISTS {self.table_name} (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content TEXT NOT NULL,
                embedding vector({self.dimension}),
                metadata JSONB DEFAULT '{{}}',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS {self.table_name}_embedding_idx
            ON {self.table_name}
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """)

    async def add(
        self,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        id: Optional[str] = None,
    ) -> str:
        """Add a vector to the store."""
        import json

        db = await self._get_db()
        entry_id = id or str(uuid4())

        # Format embedding for pgvector
        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

        await db.execute(f"""
            INSERT INTO {self.table_name} (id, content, embedding, metadata)
            VALUES ($1, $2, $3::vector, $4::jsonb)
            ON CONFLICT (id) DO UPDATE
            SET content = EXCLUDED.content,
                embedding = EXCLUDED.embedding,
                metadata = EXCLUDED.metadata
        """, entry_id, content, embedding_str, json.dumps(metadata or {}))

        return entry_id

    async def add_batch(
        self,
        entries: List[Tuple[str, List[float], Optional[Dict[str, Any]]]],
    ) -> List[str]:
        """Add multiple vectors to the store."""
        import json

        db = await self._get_db()
        ids = []

        async with db.transaction() as conn:
            for content, embedding, metadata in entries:
                entry_id = str(uuid4())
                embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

                await conn.execute(f"""
                    INSERT INTO {self.table_name} (id, content, embedding, metadata)
                    VALUES ($1, $2, $3::vector, $4::jsonb)
                """, entry_id, content, embedding_str, json.dumps(metadata or {}))

                ids.append(entry_id)

        return ids

    async def search(
        self,
        query_embedding: List[float],
        k: int = 10,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        """Search for similar vectors using cosine similarity."""
        import json

        db = await self._get_db()
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # Build filter clause
        filter_clause = ""
        filter_params: List[Any] = [embedding_str, k]

        if filter:
            filter_conditions = []
            for i, (key, value) in enumerate(filter.items(), start=3):
                filter_conditions.append(f"metadata->>'{key}' = ${i}")
                filter_params.append(value)
            if filter_conditions:
                filter_clause = "WHERE " + " AND ".join(filter_conditions)

        query = f"""
            SELECT
                id,
                content,
                metadata,
                1 - (embedding <=> $1::vector) as score
            FROM {self.table_name}
            {filter_clause}
            ORDER BY embedding <=> $1::vector
            LIMIT $2
        """

        rows = await db.fetch(query, *filter_params)

        return [
            VectorSearchResult(
                id=str(row["id"]),
                content=row["content"],
                metadata=json.loads(row["metadata"]) if isinstance(row["metadata"], str) else row["metadata"],
                score=float(row["score"]),
            )
            for row in rows
        ]

    async def delete(self, id: str) -> bool:
        """Delete a vector from the store."""
        db = await self._get_db()
        result = await db.execute(
            f"DELETE FROM {self.table_name} WHERE id = $1",
            id,
        )
        return "DELETE 1" in result

    async def get(self, id: str) -> Optional[VectorEntry]:
        """Get a vector by ID."""
        import json

        db = await self._get_db()
        row = await db.fetchrow(
            f"SELECT id, content, embedding::text, metadata FROM {self.table_name} WHERE id = $1",
            id,
        )

        if not row:
            return None

        # Parse embedding from text
        embedding_str = row["embedding"].strip("[]")
        embedding = [float(x) for x in embedding_str.split(",")]

        return VectorEntry(
            id=str(row["id"]),
            content=row["content"],
            embedding=embedding,
            metadata=json.loads(row["metadata"]) if isinstance(row["metadata"], str) else row["metadata"],
        )


def get_vector_store(
    backend: str = "memory",
    **kwargs,
) -> VectorStore:
    """Get a vector store instance.

    Args:
        backend: "memory" or "pgvector"
        **kwargs: Backend-specific options

    Returns:
        VectorStore instance
    """
    if backend == "memory":
        return InMemoryVectorStore(**kwargs)
    elif backend == "pgvector":
        return PgVectorStore(**kwargs)
    else:
        raise ValueError(f"Unknown vector store backend: {backend}")
