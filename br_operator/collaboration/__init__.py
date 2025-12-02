# BlackRoad OS - Collaboration Engine
# 30K Concurrent Collaborators with CRDT/OT
#
# @blackroad_name: Collaboration Engine
# @operator: alexa.operator.v1

from .crdt import (
    CRDT,
    LWWRegister,
    GCounter,
    PNCounter,
    ORSet,
    RGA,
)
from .vector_clock import VectorClock
from .session import (
    CollaborationSession,
    SessionManager,
    Participant,
    ParticipantRole,
)
from .shard import (
    Shard,
    ShardManager,
    ConsistentHash,
)
from .gossip import (
    GossipProtocol,
    GossipMessage,
)

__all__ = [
    # CRDT types
    "CRDT",
    "LWWRegister",
    "GCounter",
    "PNCounter",
    "ORSet",
    "RGA",
    # Vector clock
    "VectorClock",
    # Session management
    "CollaborationSession",
    "SessionManager",
    "Participant",
    "ParticipantRole",
    # Sharding
    "Shard",
    "ShardManager",
    "ConsistentHash",
    # Gossip
    "GossipProtocol",
    "GossipMessage",
]
