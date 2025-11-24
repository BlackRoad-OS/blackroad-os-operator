# CADLAC Grammar Sketch

This is an informal, BNF-style sketch of the language.

```text
contract      ::= "contract" STRING "version" NUMBER "{" sections "}"
sections      ::= { section }
section       ::= scope | parties | definitions | obligations | events | remedies

scope         ::= "scope" "{" scope_item* "}"
scope_item    ::= "term" "from" DATE "to" DATE
                | "jurisdiction" STRING
                | IDENT "=" expression

parties       ::= "parties" "{" party+ "}"
party         ::= IDENT "role" STRING ["optional"]

definitions   ::= "definitions" "{" definition+ "}"
definition    ::= IDENT "=" expression

obligations   ::= "obligations" "{" obligation+ "}"
obligation    ::= subject modal action_clause

events        ::= "events" "{" event+ "}"
event         ::= "event" IDENT "when" condition

remedies      ::= "remedies" "{" remedy+ "}"
remedy        ::= "on" IDENT "{" action_clause+ "}"

subject       ::= IDENT
modal         ::= "MUST" | "MAY" | "MUST NOT"
action_clause ::= expression

expression    ::= (very lightly structured, mostly English-like DSL)
condition     ::= expression (boolean-context)
```

This is not a full formal grammar yet, but good enough to start:

* Writing a tokenizer / parser.
* Mapping AST nodes into an internal Operator model.
* Experimenting with contract-driven operations.

Future refinements:

* Types for amounts (`USD`, `ETH`, `percent`, `day`).
* Time windows (`rollingWindow 30 day`).
* Collections (`anyThirdParty`, `consecutiveMonth`).
* Integration with event sources (`eth.balanceOf`, `uptime` metrics).

```
