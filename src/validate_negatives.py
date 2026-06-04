import csv
from src.graphs.io import carregar_dataset_parte2

def main():
    g = carregar_dataset_parte2('data/dataset_parte2')
    print('GRAPH_ORDER', g.order())
    print('GRAPH_SIZE', g.size())

    files = ['data/negative_edges.csv', 'data/negative_cycle.csv']
    ids = set()
    for f in files:
        print('\n---', f)
        with open(f, encoding='utf-8') as fh:
            reader = csv.DictReader(fh)
            rows = list(reader)
            print('ROWS', len(rows))
            for r in rows:
                o = r['origin']
                d = r['destination']
                w = float(r['weight'])
                print('ROW', o, d, w)
                ids.add(o);
                ids.add(d)

    part1_ids = {'REC','POA','GRU','MAO'}
    missing = []
    for id in sorted(ids):
        exists = g.has_node(id)
        print('ID', id, 'exists_in_marvel', exists, 'is_part1', id in part1_ids)
        if not exists and id not in part1_ids:
            missing.append(id)

    # cycle sum
    with open('data/negative_cycle.csv', encoding='utf-8') as fh:
        rc = csv.DictReader(fh)
        s = sum(float(rw['weight']) for rw in rc)
    print('\nNEGATIVE_CYCLE_SUM', s)

    print('\nALL_IDS_OK' if not missing else ('MISSING_IDS:' + ','.join(missing)))

if __name__ == '__main__':
    main()
