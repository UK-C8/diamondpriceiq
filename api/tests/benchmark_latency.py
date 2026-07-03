"""
Local latency benchmark for the /v1/estimate endpoint.
Run with: python tests/benchmark_latency.py
Requires the server to be running at http://localhost:8000.
"""

import time
import statistics
import urllib.request
import json
import sys


ENDPOINT = "http://localhost:8000/v1/estimate"
N_REQUESTS = 200
SINGLE_PAYLOAD = {
    "stone": {"carat": 1.0, "cut": "Ideal", "color": "G", "clarity": "VS1"}
}
BATCH_PAYLOAD = {
    "stones": [
        {"carat": round(0.3 + i * 0.05, 2), "cut": "Ideal", "color": "G", "clarity": "VS1"}
        for i in range(10)
    ]
}


def post(payload: dict) -> float:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        ENDPOINT, data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=5) as resp:
        resp.read()
    return (time.perf_counter() - t0) * 1000


def run_benchmark(label: str, payload: dict, n: int = N_REQUESTS):
    latencies = []
    errors = 0
    for _ in range(n):
        try:
            latencies.append(post(payload))
        except Exception as e:
            errors += 1

    if not latencies:
        print(f"[{label}] All {n} requests failed.")
        return

    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    mean = statistics.mean(latencies)

    print(f"\n[{label}] n={n}  errors={errors}")
    print(f"  mean={mean:.1f}ms  p50={p50:.1f}ms  p95={p95:.1f}ms  p99={p99:.1f}ms")

    target = 400.0
    status = "✓ PASS" if p95 <= target else "✗ FAIL"
    print(f"  p95 target <{target}ms: {status}")
    return p95


if __name__ == "__main__":
    print("=== DiamondPrice IQ API Latency Benchmark ===")
    print(f"Target: p95 < 400ms\n")

    single_p95 = run_benchmark("Single stone", SINGLE_PAYLOAD)
    batch_p95 = run_benchmark("Batch (10 stones)", BATCH_PAYLOAD)

    if single_p95 is not None and single_p95 > 400:
        sys.exit(1)
