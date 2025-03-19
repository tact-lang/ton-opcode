# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.1] - 2025-03-07

Removed `postinstall` script.

## [0.3.0] - 2025-02-27

`disassembleRoot` now supports any layouts without throwing `LayoutError`.

## [0.2.0] - 2025-02-20

- Fixed issues with building as package
- Don't add Fift WASM to package

## [0.1.0] - 2025-02-18

- Completely new version based on TVM specification, much more robust and stable

## [0.0.19] - 2025-01-22

- Splited decompilation to AST and Writer: PR [#26](https://github.com/tact-lang/ton-opcode/pull/26)
- Added more aliases: `x ADD => x ADDCONST, -1 ADD => DEC, -1 MUL => NEGATE`. PR [#29](https://github.com/tact-lang/ton-opcode/pull/29)
- Added support for `SDBEGINS` and `SDBEGINSQ` opcodes. PR [#31](https://github.com/tact-lang/ton-opcode/pull/31)

## [0.0.18] - 2025-01-05

### Added

- Support of `GETFORWARDFEE` opcode: PR [#23](https://github.com/tact-lang/ton-opcode/pull/23)

## [0.0.17] - 2025-01-03

### Added

- Support of `GETGASFEE` opcode: PR [#21](https://github.com/tact-lang/ton-opcode/pull/21)

### Updated

- Node.js version to match tact compiler requirements.

## [0.0.16] - 2024-07-21

### Added

- Test decompilation of the binary produced for [`mathlib.fc`](https://github.com/ton-blockchain/ton/blob/5c392e0f2d946877bb79a09ed35068f7b0bd333a/crypto/smartcont/mathlib.fc): PR [#16](https://github.com/tact-lang/ton-opcode/pull/16)

### Fixed

- Division instructions parsing: PR [#16](https://github.com/tact-lang/ton-opcode/pull/16)

## [0.0.15] - 2024-06-09

### Added

- All new opcodes from TVM Upgrade `2023.07`: PR [#7](https://github.com/tact-lang/ton-opcode/pull/7)
- All new opcodes from TVM Upgrade `2024.04`: PR [#12](https://github.com/tact-lang/ton-opcode/pull/12)

## [0.0.14] - 2023-09-05

### Changed

- Migrated to @ton org libraries and upgraded tvm-disassembler version

## [0.0.13] - 2023-04-08

## Fixed

- Fix `PUSHREFCONT` opcode handling

## [0.0.12] - 2023-03-28

## Changed

- Deterministic function name ordering

## Added

- `lazy_deployment_completed` and `get_abi_ipfs` to known methods

## [0.0.11] - 2023-03-27

## Fixed

- Fixed implicit jump handling

## [0.0.10] - 2023-03-27

## Fixed

- Fix opcode offsets and source cell hash in `PUSHCONT` opcode that could lead to broken code coverage

## Changed

- Upgrade to `ton-core@0.49.0`

## [0.0.9] - 2023-03-24

- Fix oppcode length in shifted cells

## [0.0.8] - 2023-03-24

## Fixed

- Fix hashes in shifted cells

## [0.0.7] - 2023-03-24

## Fixed

- Fix opcode offsets in shifted cells

## [0.0.6] - 2023-03-24

## Fixed

- Fix invalid cell hash and offset in dict-based parser

## [0.0.5] - 2023-03-24

## Changed

- Change printer interface and include more lines in opcode related printer

## [0.0.4] - 2023-03-24

## Added

- Added support for custom printer in decompiler

## [0.0.3] - 2023-03-24

## Added

- Handling debug opcodes

## Changed

- Change unknown function name prefix

## Fixed

- Missigng IFJMPREF processing in decompileAll

## [0.0.2] - 2023-03-24

## Fixed

- Fix missing typescript typings

## [0.0.1]

⚡️ Initial release
