# CADLAC Language Overview

CADLAC (Contractual Agreement Definition Language And Code) is a DSL for
expressing contracts as structured, semi-formal text.

## Top-Level Structure

Every file starts with a `contract` block:

```cadlac
contract "Name" version 1.0 {
  scope { ... }
  parties { ... }
  definitions { ... }
  obligations { ... }
  events { ... }
  remedies { ... }
}
```

Sections:

* `scope` – global metadata:

  * `term from <DATE> to <DATE>`
  * `jurisdiction <STRING>`
  * other contract-wide settings.

* `parties` – named actors:

  ```cadlac
  parties {
    Seller  role "Provider";
    Buyer   role "Customer";
    Oracle  role "PriceFeed" optional;
  }
  ```

* `definitions` – named expressions and constants:

  ```cadlac
  definitions {
    BusinessDay =
      any day where banksOpenIn("New York, USA")
      AND NOT (isWeekend OR isPublicHoliday);

    MonthlyFee = 99 USD;
  }
  ```

* `obligations` – deontic statements (MUST / MAY / MUST NOT):

  ```cadlac
  obligations {
    Seller MUST deliver "Digital Product"
      within 3 BusinessDay of Buyer.paymentReceived;

    Buyer MUST NOT shareAccessCredentials
      with anyThirdParty;
  }
  ```

* `events` – named logical conditions:

  ```cadlac
  events {
    event LateDelivery when
      Seller.deliveryDate > (Buyer.paymentDate + 3 BusinessDay);
  }
  ```

* `remedies` – responses when events occur:

  ```cadlac
  remedies {
    on LateDelivery {
      Buyer MAY request discount 10 percent;
      Seller MUST apply credit to nextInvoice;
    }
  }
  ```

## Keywords

Core modal verbs:

* `MUST` – hard obligation.
* `MAY` – permission.
* `MUST NOT` – prohibition.

These map cleanly to an internal model:

* `Obligation(subject, action)`
* `Permission(subject, action)`
* `Prohibition(subject, action)`

## Intended Semantics

The Operator can:

1. Parse `obligations` into structured rules:

   * who is responsible
   * under what conditions
   * what time constraints apply

2. Parse `events` into trigger conditions that can be bound to:

   * telemetry / metrics
   * logs
   * external system hooks
   * on-chain events

3. Parse `remedies` into actions:

   * notifications
   * workflow steps
   * external API calls
   * state transitions in the BlackRoad OS

For a more formal sketch, see `grammar_sketch.md`.

```
