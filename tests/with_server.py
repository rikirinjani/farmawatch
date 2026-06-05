#!/usr/bin/env python3
import sys
import subprocess
import signal
import time
import argparse

def main():
    parser = argparse.ArgumentParser(description="Start server, run command, stop server")
    parser.add_argument("--server", required=True, action="append", nargs=2,
                        metavar=("CMD", "PORT"), help="Server command and port")
    parser.add_argument("command", nargs=argparse.REMAINDER, help="Command to run")
    args = parser.parse_args()

    servers = {}
    try:
        for cmd, port in args.server:
            proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            servers[port] = proc
            print(f"Started server on port {port} (PID {proc.pid})", file=sys.stderr)

        # Wait for servers to be ready
        for port in [p for _, p in args.server]:
            for _ in range(30):
                try:
                    import urllib.request
                    urllib.request.urlopen(f"http://localhost:{port}", timeout=2)
                    print(f"Server on port {port} ready", file=sys.stderr)
                    break
                except:
                    time.sleep(2)
            else:
                print(f"Server on port {port} not ready, continuing", file=sys.stderr)

        if args.command:
            result = subprocess.run(" ".join(args.command), shell=True)
            sys.exit(result.returncode)
    finally:
        for port, proc in servers.items():
            proc.terminate()
            proc.wait(timeout=5)

if __name__ == "__main__":
    main()
