# Stacks
> Leveraging Docker containerization to produce full architectural stacks for various environments

## Goals

The goal for the "stacks" in the `ember-horizon` addon is to provide usable architectures which will support each stage of the development/production lifecycle. This configuration will be opinionated but configurable. Please help us to build out an ecosystem of variation stacks and/or help us find ways to make this approach more extensible while maintaining opinion.

## Environments

To start we will target three environments which will have "out-of-the-box" stacks:

- **Dev** - Our normal process in Emberland is to run `ember serve` and let the CLI take care of us. We're not really moving away from that but with this environment we get a single command `ember horizon:serve` which:
  - serves static content with (containerized) **ember-cli**
  - starts **horizon** and **rethinkDB** in separate containers
  - starts **consul** for service discovery and basic health checks
- **CI** - A cloud-hosted, Jenkins-based CI server which acts as a full-fledged integration test environment -- including all application and devops components -- to make it a production-like in all important characteristics other than possibly performance and scale. It is expected that this environment should be able to shutdown and startup based on events (commits) so as to allow a commercially reasonable solution while allowing for better mimicking of the prod environment.
- **Prod** - Cloud-based production architecture with auto-scaling API servers, shardable databases, service discovery, health monitoring, log aggregation, and self-healing.
