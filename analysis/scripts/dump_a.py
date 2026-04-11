import os

def run():
    in_file = "analysis/data/raw/attack_simulation_defended_raw_A.json"
    out_file = "raw_A_dump.txt"
    try:
        with open(in_file, 'r', encoding='utf-16') as f:
            content = f.read()
    except Exception:
        with open(in_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    run()