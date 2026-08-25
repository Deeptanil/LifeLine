import json
import os
from pathlib import Path

from graphify.detect import detect
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

def main():
    root = Path('.').resolve()
    out_dir = root / 'graphify-out'
    out_dir.mkdir(exist_ok=True)

    det_res = detect(root)
    (out_dir / '.graphify_detect.json').write_text(json.dumps(det_res, ensure_ascii=False), encoding='utf-8')
    print(f"Detected {det_res.get('total_files', 0)} files")

    code_files = []
    for f in det_res.get('files', {}).get('code', []):
        p = Path(f)
        code_files.extend(collect_files(p) if p.is_dir() else [p])

    print(f"Code files collected: {len(code_files)}")
    ast_res = extract(code_files, cache_root=root, parallel=False)
    (out_dir / '.graphify_ast.json').write_text(json.dumps(ast_res, indent=2, ensure_ascii=False), encoding='utf-8')

    sem_res = {'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
    (out_dir / '.graphify_semantic.json').write_text(json.dumps(sem_res, ensure_ascii=False), encoding='utf-8')

    seen = {n['id'] for n in ast_res['nodes']}
    merged_nodes = list(ast_res['nodes'])
    for n in sem_res['nodes']:
        if n['id'] not in seen:
            merged_nodes.append(n)
            seen.add(n['id'])

    merged_edges = ast_res['edges'] + sem_res['edges']
    extraction = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': [],
        'input_tokens': 0,
        'output_tokens': 0
    }
    (out_dir / '.graphify_extract.json').write_text(json.dumps(extraction, indent=2, ensure_ascii=False), encoding='utf-8')

    G = build_from_json(extraction, root=str(root), directed=False)
    print(f"Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)

    community_nodes = {}
    if isinstance(communities, dict):
        for k, v in communities.items():
            if isinstance(v, (list, tuple, set)):
                community_nodes[k] = [str(n) for n in v]
            else:
                community_nodes.setdefault(v, []).append(str(k))

    labels = {}
    for comm_id, nodes in community_nodes.items():
        node_str = " ".join(nodes).lower()
        if any(k in node_str for k in ["_layout", "doctor", "emergency", "medicine", "symptoms", "profile", "iot"]):
            labels[comm_id] = "App Pages & Navigation"
        elif any(k in node_str for k in ["esp32", "ino", "button", "raspberry"]):
            labels[comm_id] = "IoT & Hardware Dispatch"
        elif any(k in node_str for k in ["context", "dispatchcontext", "authcontext", "database"]):
            labels[comm_id] = "State Management & Storage"
        elif any(k in node_str for k in ["navigationheader", "themed", "animated", "ui"]):
            labels[comm_id] = "UI Components & Styling"
        elif any(k in node_str for k in ["server", "dev", "script"]):
            labels[comm_id] = "Backend Server & Scripts"
        else:
            labels[comm_id] = f"Core Subsystem {comm_id}"

    questions = suggest_questions(G, communities, labels)
    report = generate(G, communities, cohesion, labels, gods, surprises, det_res, {'input':0, 'output':0}, str(root), suggested_questions=questions)
    (out_dir / 'GRAPH_REPORT.md').write_text(report, encoding='utf-8')
    (out_dir / '.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding='utf-8')
    to_json(G, communities, str(out_dir / 'graph.json'), community_labels=labels)
    to_html(G, communities, str(out_dir / 'graph.html'), community_labels=labels)

    print("Graphify pipeline execution and HTML export complete!")

if __name__ == '__main__':
    main()
