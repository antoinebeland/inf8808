import sys, argparse, csv

def main(argv):
    inputfile = ""
    outputfile = ""
    parser = argparse.ArgumentParser(description="Réduire le fichier de rapports d'accidents")
    parser.add_argument('infile', type=argparse.FileType("r", encoding="utf-8-sig"))
    parser.add_argument('outfile', type=argparse.FileType("w"))

    args = parser.parse_args()

    csvwriter = csv.writer(args.outfile)

    content = csv.reader(args.infile)

    row_idx_remove = [0, 1, 23, 24, 25, 26, 27, 29, 30, 31, 32]
    row_idx_remove = list(reversed(sorted(row_idx_remove)))

    gravity = {
        "Dommages matériels seulement": 0,
        "Léger": 1,
        "Grave": 2,
        "Mortel": 3
    }

    is_header = True
    for row in content:
        if is_header:
            is_header = False
        else:
            row[5] = gravity[row[5]]
        [row.pop(row_idx) for row_idx in row_idx_remove]
        csvwriter.writerow(row)

if __name__ == "__main__":
    main(sys.argv[1:])

