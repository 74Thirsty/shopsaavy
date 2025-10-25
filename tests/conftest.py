import os
import sys
from pathlib import Path

SRC_PATH = Path(__file__).resolve().parent.parent / "src"
if SRC_PATH.exists():
    sys.path.insert(0, str(SRC_PATH))

APP_PATH = Path(__file__).resolve().parent.parent / "app"
if APP_PATH.exists():
    sys.path.insert(0, str(APP_PATH.parent))

os.environ.setdefault("PYTHONPATH", str(SRC_PATH))
