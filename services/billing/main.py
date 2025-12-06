"""
BlackRoad Billing Service
=========================
Secure Stripe integration layer for BlackRoad OS.

Architecture:
    Agent (Cece/Claude) -> This Backend -> Stripe API

Agents NEVER see:
    - sk_live_... (Stripe secret keys)
    - Webhook signing secrets
    - Raw card data

They only see:
    - Checkout URLs
    - Subscription status
    - Plan names

@owner Alexa Louise Amundson
@service blackroad-billing
@version 1.0.0
@consensus SHA-2048->SHA-256 (UNANIMOUS)
"""

import os
import time
import hashlib
import hmac
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

import stripe
from fastapi import FastAPI, HTTPException, Request, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# =============================================================================
# CONFIGURATION
# =============================================================================

# Stripe keys from environment (NEVER hardcode!)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# Price IDs for each plan (set these in Railway/env)
PLANS = {
    "solo": {
        "price_id": os.getenv("STRIPE_PRICE_SOLO", "price_solo_placeholder"),
        "name": "Solo",
        "description": "For individual creators and developers",
        "features": ["1 agent", "10K API calls/mo", "Community support"],
        "price_monthly": 9,
        "price_yearly": 90,
    },
    "team": {
        "price_id": os.getenv("STRIPE_PRICE_TEAM", "price_team_placeholder"),
        "name": "Team",
        "description": "For small teams building together",
        "features": ["5 agents", "100K API calls/mo", "Priority support", "Team dashboard"],
        "price_monthly": 29,
        "price_yearly": 290,
    },
    "enterprise": {
        "price_id": os.getenv("STRIPE_PRICE_ENTERPRISE", "price_enterprise_placeholder"),
        "name": "Enterprise",
        "description": "For organizations at scale",
        "features": ["Unlimited agents", "Unlimited API calls", "Dedicated support", "Custom integrations", "SLA"],
        "price_monthly": 199,
        "price_yearly": 1990,
    },
}

# URLs
SUCCESS_URL = os.getenv("BILLING_SUCCESS_URL", "https://blackroad.io/billing/success")
CANCEL_URL = os.getenv("BILLING_CANCEL_URL", "https://blackroad.io/billing/cancel")
PORTAL_RETURN_URL = os.getenv("BILLING_PORTAL_RETURN_URL", "https://blackroad.io/dashboard")


# =============================================================================
# APP SETUP
# =============================================================================

app = FastAPI(
    title="BlackRoad Billing",
    description="Secure Stripe integration for BlackRoad OS",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# MODELS
# =============================================================================

class PlanType(str, Enum):
    SOLO = "solo"
    TEAM = "team"
    ENTERPRISE = "enterprise"


class CheckoutRequest(BaseModel):
    """Request to create a checkout session."""
    plan: PlanType = Field(..., description="Billing plan to subscribe to")
    customer_email: Optional[str] = Field(None, description="Customer email for pre-fill")
    success_url: Optional[str] = Field(None, description="Override success redirect URL")
    cancel_url: Optional[str] = Field(None, description="Override cancel redirect URL")


class CheckoutResponse(BaseModel):
    """Response with checkout session details."""
    checkout_url: str
    session_id: str
    plan: str
    expires_at: str


class PortalRequest(BaseModel):
    """Request to create a billing portal session."""
    customer_id: str = Field(..., description="Stripe customer ID")
    return_url: Optional[str] = Field(None, description="Override return URL")


class PortalResponse(BaseModel):
    """Response with portal session details."""
    portal_url: str
    customer_id: str


class SubscriptionStatus(BaseModel):
    """Subscription status response."""
    active: bool
    plan: Optional[str]
    status: str
    current_period_end: Optional[str]
    cancel_at_period_end: bool


class PlanInfo(BaseModel):
    """Plan information for display."""
    id: str
    name: str
    description: str
    features: List[str]
    price_monthly: int
    price_yearly: int


class LedgerEvent(BaseModel):
    """Billing ledger event for audit trail."""
    event_id: str
    timestamp: str
    event_type: str
    customer_id: Optional[str]
    plan: Optional[str]
    amount: Optional[int]
    currency: Optional[str]
    details: Dict[str, Any]


# =============================================================================
# LEDGER (Audit Trail)
# =============================================================================

# In-memory ledger (in production, use PostgreSQL/Redis)
billing_ledger: List[LedgerEvent] = []


def log_billing_event(
    event_type: str,
    customer_id: Optional[str] = None,
    plan: Optional[str] = None,
    amount: Optional[int] = None,
    currency: Optional[str] = None,
    details: Optional[Dict] = None,
) -> LedgerEvent:
    """Log a billing event to the ledger."""
    event = LedgerEvent(
        event_id=hashlib.sha256(f"{time.time_ns()}".encode()).hexdigest()[:16],
        timestamp=datetime.utcnow().isoformat() + "Z",
        event_type=event_type,
        customer_id=customer_id,
        plan=plan,
        amount=amount,
        currency=currency,
        details=details or {},
    )
    billing_ledger.append(event)
    print(f"[LEDGER] {event.event_type}: {event.details}")
    return event


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "blackroad-billing",
        "stripe_configured": bool(stripe.api_key),
        "plans_available": list(PLANS.keys()),
    }


@app.get("/plans", response_model=List[PlanInfo])
async def list_plans():
    """List all available billing plans."""
    return [
        PlanInfo(
            id=plan_id,
            name=plan["name"],
            description=plan["description"],
            features=plan["features"],
            price_monthly=plan["price_monthly"],
            price_yearly=plan["price_yearly"],
        )
        for plan_id, plan in PLANS.items()
    ]


@app.get("/plans/{plan_id}", response_model=PlanInfo)
async def get_plan(plan_id: str):
    """Get details for a specific plan."""
    if plan_id not in PLANS:
        raise HTTPException(status_code=404, detail=f"Plan '{plan_id}' not found")

    plan = PLANS[plan_id]
    return PlanInfo(
        id=plan_id,
        name=plan["name"],
        description=plan["description"],
        features=plan["features"],
        price_monthly=plan["price_monthly"],
        price_yearly=plan["price_yearly"],
    )


@app.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(body: CheckoutRequest):
    """
    Create a Stripe Checkout session for a subscription.

    This is what agents call to start a subscription flow.
    Returns a checkout URL that the human clicks.
    """
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    plan = PLANS.get(body.plan.value)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": plan["price_id"], "quantity": 1}],
            success_url=body.success_url or SUCCESS_URL,
            cancel_url=body.cancel_url or CANCEL_URL,
            customer_email=body.customer_email,
            metadata={
                "plan": body.plan.value,
                "source": "blackroad-billing",
            },
        )

        log_billing_event(
            event_type="BILLING.CHECKOUT.CREATED",
            plan=body.plan.value,
            details={
                "session_id": session.id,
                "customer_email": body.customer_email,
            },
        )

        return CheckoutResponse(
            checkout_url=session.url,
            session_id=session.id,
            plan=body.plan.value,
            expires_at=datetime.fromtimestamp(session.expires_at).isoformat() + "Z",
        )

    except stripe.error.StripeError as e:
        log_billing_event(
            event_type="BILLING.CHECKOUT.ERROR",
            plan=body.plan.value,
            details={"error": str(e)},
        )
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/portal", response_model=PortalResponse)
async def create_portal_session(body: PortalRequest):
    """
    Create a Stripe Billing Portal session.

    This lets customers manage their subscription:
    - Update payment method
    - Cancel subscription
    - View invoices
    """
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    try:
        session = stripe.billing_portal.Session.create(
            customer=body.customer_id,
            return_url=body.return_url or PORTAL_RETURN_URL,
        )

        log_billing_event(
            event_type="BILLING.PORTAL.CREATED",
            customer_id=body.customer_id,
            details={"session_url": session.url[:50] + "..."},
        )

        return PortalResponse(
            portal_url=session.url,
            customer_id=body.customer_id,
        )

    except stripe.error.StripeError as e:
        log_billing_event(
            event_type="BILLING.PORTAL.ERROR",
            customer_id=body.customer_id,
            details={"error": str(e)},
        )
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/subscription/{customer_id}", response_model=SubscriptionStatus)
async def get_subscription_status(customer_id: str):
    """
    Get subscription status for a customer.

    Agents can use this to check if a user is subscribed.
    """
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    try:
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status="all",
            limit=1,
        )

        if not subscriptions.data:
            return SubscriptionStatus(
                active=False,
                plan=None,
                status="none",
                current_period_end=None,
                cancel_at_period_end=False,
            )

        sub = subscriptions.data[0]
        plan_name = None

        # Try to match the price to our plans
        if sub.items.data:
            price_id = sub.items.data[0].price.id
            for plan_id, plan in PLANS.items():
                if plan["price_id"] == price_id:
                    plan_name = plan_id
                    break

        return SubscriptionStatus(
            active=sub.status == "active",
            plan=plan_name,
            status=sub.status,
            current_period_end=datetime.fromtimestamp(sub.current_period_end).isoformat() + "Z",
            cancel_at_period_end=sub.cancel_at_period_end,
        )

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/webhook")
async def handle_webhook(request: Request):
    """
    Handle Stripe webhooks.

    Stripe calls this when subscription events occur:
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.paid
    - invoice.payment_failed
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not STRIPE_WEBHOOK_SECRET:
        # In dev mode without webhook secret, just log
        print("[WEBHOOK] No secret configured, skipping verification")
        event = stripe.Event.construct_from(
            await request.json(), stripe.api_key
        )
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "customer.subscription.created":
        log_billing_event(
            event_type="BILLING.SUBSCRIPTION.CREATED",
            customer_id=data.get("customer"),
            details={"subscription_id": data.get("id"), "status": data.get("status")},
        )

    elif event_type == "customer.subscription.updated":
        log_billing_event(
            event_type="BILLING.SUBSCRIPTION.UPDATED",
            customer_id=data.get("customer"),
            details={"subscription_id": data.get("id"), "status": data.get("status")},
        )

    elif event_type == "customer.subscription.deleted":
        log_billing_event(
            event_type="BILLING.SUBSCRIPTION.DELETED",
            customer_id=data.get("customer"),
            details={"subscription_id": data.get("id")},
        )

    elif event_type == "invoice.paid":
        log_billing_event(
            event_type="BILLING.INVOICE.PAID",
            customer_id=data.get("customer"),
            amount=data.get("amount_paid"),
            currency=data.get("currency"),
            details={"invoice_id": data.get("id")},
        )

    elif event_type == "invoice.payment_failed":
        log_billing_event(
            event_type="BILLING.INVOICE.FAILED",
            customer_id=data.get("customer"),
            amount=data.get("amount_due"),
            currency=data.get("currency"),
            details={"invoice_id": data.get("id")},
        )

    return {"received": True}


@app.get("/ledger", response_model=List[LedgerEvent])
async def get_ledger(limit: int = 100):
    """
    Get billing ledger events (audit trail).

    For compliance and debugging.
    """
    return billing_ledger[-limit:]


# =============================================================================
# AGENT TOOL HELPERS
# =============================================================================

@app.post("/agent/recommend-plan")
async def recommend_plan(
    agent_count: int = 1,
    expected_api_calls: int = 1000,
    needs_support: bool = False,
):
    """
    Recommend a plan based on usage.

    Agents can call this to suggest the right plan to users.
    """
    if agent_count > 5 or expected_api_calls > 100000 or needs_support:
        recommended = "enterprise"
        reason = "Your usage requires dedicated support and unlimited resources."
    elif agent_count > 1 or expected_api_calls > 10000:
        recommended = "team"
        reason = "Perfect for small teams with moderate usage."
    else:
        recommended = "solo"
        reason = "Great for individual creators getting started."

    plan = PLANS[recommended]

    return {
        "recommended_plan": recommended,
        "reason": reason,
        "plan_details": {
            "name": plan["name"],
            "price_monthly": plan["price_monthly"],
            "features": plan["features"],
        },
        "next_action": f"Call /checkout with plan='{recommended}' to start subscription.",
    }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8081"))
    print(f"Starting BlackRoad Billing on port {port}")
    print(f"Stripe configured: {bool(stripe.api_key)}")
    print(f"Plans: {list(PLANS.keys())}")

    uvicorn.run(app, host="0.0.0.0", port=port)
