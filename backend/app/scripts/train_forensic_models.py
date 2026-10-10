"""Train and register a forensic model from a reviewed local CSV dataset."""

import argparse
import json

from app.forensics.training import load_training_csv, train_isolation_forest, train_xgboost_classifier


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--algorithm", choices=("xgboost", "isolation-forest"), required=True)
    parser.add_argument("--input", required=True, help="CSV file containing the documented forensic features")
    parser.add_argument("--contamination", default="auto")
    arguments = parser.parse_args()

    supervised = arguments.algorithm == "xgboost"
    rows, labels = load_training_csv(arguments.input, require_labels=supervised)
    if supervised:
        result = train_xgboost_classifier(rows, labels)
    else:
        contamination: float | str = arguments.contamination
        if contamination != "auto":
            try:
                contamination = float(contamination)
            except ValueError as exc:
                parser.error("--contamination must be 'auto' or a number between 0.01 and 0.5")
        result = train_isolation_forest(rows, contamination=contamination)
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()