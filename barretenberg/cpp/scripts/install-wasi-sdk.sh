#!/usr/bin/env bash
set -eu

if [[ -d ./src/wasi-sdk ]]; then
  echo "WASI already installed. Skipping."
  exit 0
fi

# Clean.
rm -rf ./src/wasi-sdk

# Determine system.
if [[ "$OSTYPE" == "darwin"* ]]; then
  OS=macos
elif [[ "$OSTYPE" == "linux-gnu" ]]; then
  OS=linux
else
  echo "Unknown OS: $OSTYPE"
  exit 1
fi

# Install the webassembly toolchain.
mkdir -p src
cd ./src
curl -s -L https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/wasi-sdk-20.0-$OS.tar.gz | tar zxf -
if [ "$OS" == "linux" ]; then
  # Exceptional linux case that provides an llvm build that works on Ubuntu 20.
  curl -s -L https://wasi-sdk.s3.eu-west-2.amazonaws.com/yamt-wasi-sdk-20.0.threads.tgz | tar zxf -
else
  # For other operating systems, first download the standard release (this is to get the llvm build).
  curl -s -L https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20%2Bthreads/wasi-sdk-20.0.threads-$OS.tar.gz | tar zxf -
  # Replace wasi-sysroot in wasi-sdk-20.0+threads with our custom build.
  # It contains libc++ and a patch by yamt to improve thread join stability.
  # Can remove once future releases are more stable.
  curl -s -L https://wasi-sdk.s3.eu-west-2.amazonaws.com/yamt-wasi-sysroot-20.0.threads.tgz | tar zxf -
fi
# TODO(https://github.com/AztecProtocol/barretenberg/issues/906): in the future this should use earthly and a 'SAVE ARTIFACT wasi-sdk AS LOCAL wasi-sdk'
if [ "$(id -u)" -eq 0 ]; then
  mv wasi-sdk-20.0+threads /opt/wasi-sdk
else
  sudo mv wasi-sdk-20.0+threads /opt/wasi-sdk
fi
