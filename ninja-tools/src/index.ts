// ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
//                        READ THIS FIRST!
//
// This file grew quite a bit.
// It hosts JS, HTML and CSS within it, which is why I encourage you to
// install these two VSCode extension https://bit.ly/36X6EOY and
// https://bit.ly/37rCLWY that provide syntax highlighting for template
// literals.
//
// To easily navigate this file, use your IDE's code folding feature (or
// outline explorer).
// For example, in VSCode, hitting Cmd+K Cmd+2 will display the block
// declarations for blocks of 2nd level indentation, and fold everything
// that's within those declarations.
// Try it now and look at the code (Cmd+K Cmd+0 will expand everything
// back.)
//
// This userscript implements some tools, like Scroll To Conversation,
// Show Asset Versions, etc...
// I've used closures to encapsulate every tool's inner logic, exposing
// only the required api for them to work. Please follow this practice.
//
// This file has grown and grown with time, and I probably should have
// used a bundler at some point, too bad I'm too lazy.
//
// - Eldad
//
// ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌

let shadowDOM;
