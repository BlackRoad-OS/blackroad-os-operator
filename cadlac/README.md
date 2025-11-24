# CADLAC – Contractual Agreement Definition Language And Code

CADLAC is an experimental, human-readable, machine-parseable contract language
designed for use with the BlackRoad Operator and related systems.

The goals:

- Express **obligations, permissions, and prohibitions** in a structured way.
- Be readable by non-engineers (lawyers, operators, biz).
- Be parseable and enforceable by machines (operators, agents, smart contracts).
- Bridge legal-style agreements and executable automation.

## Core Concepts

A CADLAC file is structured into semantic sections:

- `contract` – top-level metadata and wrapper.
- `scope` – term, jurisdiction, and global settings.
- `parties` – named actors with roles.
- `definitions` – reusable logical definitions and constants.
- `obligations` – who MUST / MAY / MUST NOT do what.
- `events` – named logical conditions that can be triggered.
- `remedies` – what happens when events occur.

### Minimal Example: NDA

See `examples/hello_world_nda.cadlac`:

```cadlac
contract "Hello World NDA" version 1.0 {

  parties {
    Discloser role "Party A";
    Recipient role "Party B";
  }

  scope {
    term from "2025-01-01" to "2028-01-01";
    jurisdiction "Delaware, USA";
  }

  definitions {
    ConfidentialInformation =
      any information marked "CONFIDENTIAL"
      or shared in secure channels
      except information that is (public OR independentlyDeveloped);
  }

  obligations {
    Recipient MUST NOT disclose ConfidentialInformation
      to anyThirdParty
      during scope.term
      AND for 2 years after scope.term.end;

    Recipient MAY use ConfidentialInformation
      onlyFor "evaluation of potential business relationship";
  }

  events {
    event UnauthorisedDisclosure when
      Recipient.discloses(ConfidentialInformation)
      to anyThirdParty
      without Discloser.priorWrittenConsent;
  }

  remedies {
    on UnauthorisedDisclosure {
      Recipient MUST pay liquidatedDamages of 100_000 USD;
      Discloser MAY seek injunctiveRelief;
      log "Breach: Unauthorised disclosure" severity HIGH;
    }
  }
}
```

### Operator Integration (High Level)

The BlackRoad Operator can eventually:

1. **Parse CADLAC** contracts into an internal model:

   * Parties, obligations, events, remedies.
2. **Monitor events** from systems (logs, metrics, on-chain events).
3. **Trigger remedies** (notifications, API calls, state changes).

This repo currently focuses on:

* Defining the language surface area (`spec/`).
* Providing reference examples (`examples/`).

Future work (candidate roadmap):

* `parser/` – actual parser implementation (Python/TS/Rust).
* `adapter/` – map `events` to Operator signals.
* `enforcer/` – map `remedies` to Operator actions.

See `spec/language_overview.md` for detailed semantics.

```
