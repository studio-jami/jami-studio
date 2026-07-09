# Hummingbird

Where we will install and develop the adopted codebase into our own branded product.

## Context & Outline

_ops\planning\research\open-source-adoption
_ops\planning\research\feasibility-reports
_ops\readiness
_ops\planning\research\capabilities\2026-07-08-jami-studio-capability-deep-dive.md
_ops\planning\decisions\2026-07-08-upstream-blocked-dependency-alerts.md
_ops\source-sync
C:\Users\james\orgs\oss\hummingbird
C:\Users\james\orgs\oss\avatar-agent (LIVE working voice/video real-time avatar using ElevenLabs and Anam)
_ops\planning\roadmaps\real-time\2026-07-08-realtime-voice-avatar-roadmap.md (Not active - Awaiting on our setup - roadmap may adjust as we work where necessary)

- This is an open-source codebase adoption.
- We are just beginning the 'working' discovery phase and our intentions and plans should remain flexible enough to keep us from forcing in assumptions or short-sighted approaches.
- The app depends on the inherited legacy systems.
- We have extensive research, plans, and working live prototypes that prove the voice/video agent-on-top. We WILL NOT handroll or reinvent research or work.
- After we have gotten comfortable with and extended the codebase to our satisfaction, we will then assume full namespace takeover including for registry publishing.
- We will replace *some of the inherited systems with our ownership- this will vary by system
- We will continue to pull in upstream changes through our source-sync system --which needs run manually for the early development and the automation systems need updated as we learn through our manual sync process, so it stays ready to be turned on.
- This project comes from a polished, vc-backed, design-first company in builder.io and we want to take full advantage of the codebase and continued upstream maintenance.
- We will add onto and extend the current codebase with our specific goals. including a voice-first real-time agent (think Jarvis, with optional talking-avatar), a more central orchestration focus, intentional curated workspaces across domains, a tokenzied styling system, and several focused workflow surfaces to support our domains.
- We plan a few key APP renaming/branding including MAIL, DISPATCH, CLIPS, ASSETS, DESIGN, and a few others to better fit into more cohesive workspace. We reserve the right to change our mind.
- We intend to redesign the layout/flow of the apps in a workspace; from the current single page card grid to durable sidebar categories. - this will happen after we have worked through them and understood how they best fit together in our project.
- It is possible, although not decided, that we eventually change the jami-studio repo name to make room for the app we build through hummingbird - which would become the product we offer as both an open-source framework and a SaaS type hosted webapp. We are not sure.. we retain the right to develop these ideas through the hummingbird process. It's also possible we keep the jami studio as-is and make hummingbird a commercial product. We're keeping options open.
- *Product End Goal* We will introduce a light professional and classy layer of "personality" by allowing for attaching persistent instructions, voices, and media to an "agent" (name not canon or decided-might become a branded name or stay simple). We will realize this through agent 'check-ins' (e.g. "Hey '[voice-agent]', whats on our marketing docket for the day?"[voice-agent]"Let me grab our '[marketing-agent]' and get an update. Hey Trish, can you catch us up on the Marketing Agenda for the day?"[Marekting-Agent]"Hey guys, Today in marketing.."), and through group boardroom type rooms where i can have multiple agents with optional voice/video feeds for things like daily briefs across domains, weekly summaries, "board" style meetings, where the stream is collective (each doesnt need full real-time, only when engaging, we would have idle clips to play for listening and waiting states to make the room feel alive), each agent COULD (optional- this isnt meant to be a requirment, but a reaction to the explosion of agent-apps that give agents 3d characters in fake worlds. Were envisioning giving the agents a familiar identity through sight and sounds and familiarity of a human figure)Nothing crazy - a zoom-like meeting room. --We think this, in addition to the planned core chages with the voic-eagent will set our product apart and justify the work to adopt.

## Constraints

- REQUIRED: No cost development. Must use approved subscriptions and credit pools or get explicit USER approval.
- REQUIRED: Agent<>Observability feedback loop connected and documented.
- REQUIRED: Chrome dev-tools and playwright connected and documented.
- REQURED: One canon continually updated record of work and decisions in _ops\planning\decisions.
- REQUIRED: One canon document that will catalogue the deviations we make from the source code, the change's impact, and what can/can not be accepted from upstream for that concern moving forward. this will  be ordered logically by criticality and by domain. It will live in the source-sync directory.

## Instructions

- Install in Hummingbird as a "user" and setup a "workspace" with ALL available apps including the Dispatch and the Coding UI and any other "hidden" apps that dont ship natively with the install command.
- Install in Hummingbird as a "user" each app (including the ones not listed in the main set) installed as a standalone app.
- using the existing working systems.
- ALWAYS approach any task, challenge, issue, error with an UPSTREAM mentality. whats the root cause? whats the cause of that? and that? and keep going until you run out of reasons within our control, e.g., the technology doesnt exist; There is a cost prohibition that none of our pools can cover. / Then you begin the real investigation for a proper upstream solution to avoid the downstream leakage in the future while preservign all epected systems and function.
- sync up to this repo: <https://github.com/studio-jami/hummingbird.git>
- DO NOT settle for a workaround install. Read the full official docs to understand the capabilities and options for configuring the workspace install. this product is 100% working, on MAIN, from a live vc-backed company. WE are not quesitoning the codebase. we are investigating how to extend it. We do not build the the existing systems or apps oin a slow evelopmental cadence. THNEY ARE ALREADY DEVELOPED INTO full working apps. WE REQUIRE that we implement and use/test every feature of the sourcecode. this is not an optional or maybe later item. it is THE POINT of this project.
-
