import sys

def read_utf16(path):
    try:
        with open(path, 'r', encoding='utf-16') as f:
            content = f.read()
    except Exception as e:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    print("CONTENT OF", path, ":")
    print(content[:500])
    print("...")
    print(content[-500:])

if __name__ == "__main__":
    read_utf16('analysis/data/raw/attack_simulation_defended_raw_A.json')