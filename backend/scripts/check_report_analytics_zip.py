"""Pruebas del exportador ZIP de Analytics F12.

No consulta ni modifica Supabase.
"""

import csv
import sys
import unittest

from datetime import date
from io import BytesIO, StringIO
from pathlib import Path
from zipfile import ZipFile, is_zipfile

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.dashboard import DashboardFilters
from app.services.report_export_analytics_csv import (
    ANALYTICS_COLUMNS,
)
from app.services.report_export_zip import (
    build_analytics_zip,
)

from check_report_analytics_csv import make_report


DATE_FROM = "2026-10-01"
DATE_TO = "2026-10-31"


def sample_report(**kwargs):
    """Prepara un reporte Analytics con fechas reales."""

    report = make_report(**kwargs)

    report.filters_applied = DashboardFilters(
        period="custom",
        date_from=date(2026, 10, 1),
        date_to=date(2026, 10, 31),
    )

    return report


def expected_name(dataset):
    return (
        f"analytics_{dataset}_"
        f"{DATE_FROM}_{DATE_TO}.csv"
    )


def read_csv(content):
    return list(
        csv.reader(
            StringIO(
                content.decode("utf-8-sig"),
                newline="",
            )
        )
    )


class AnalyticsZipTests(unittest.TestCase):

    def test_generates_valid_zip(self):
        """El generador devuelve un ZIP válido."""

        content = build_analytics_zip(sample_report())

        self.assertIsInstance(content, bytes)
        self.assertTrue(is_zipfile(BytesIO(content)))

    def test_contains_seven_datasets(self):
        """Incluye exactamente siete archivos CSV."""

        content = build_analytics_zip(sample_report())

        with ZipFile(BytesIO(content)) as archive:
            self.assertEqual(
                len(archive.namelist()),
                7,
            )

    def test_expected_filenames(self):
        """Los nombres incluyen el período solicitado."""

        content = build_analytics_zip(sample_report())

        with ZipFile(BytesIO(content)) as archive:
            self.assertEqual(
                set(archive.namelist()),
                {
                    expected_name(dataset)
                    for dataset in ANALYTICS_COLUMNS
                },
            )

    def test_csv_headers(self):
        """Cada CSV conserva sus columnas."""

        content = build_analytics_zip(sample_report())

        with ZipFile(BytesIO(content)) as archive:
            for dataset, columns in ANALYTICS_COLUMNS.items():
                with self.subTest(dataset=dataset):
                    rows = read_csv(
                        archive.read(expected_name(dataset))
                    )

                    self.assertEqual(rows[0], columns)

    def test_kpis_content(self):
        """El ZIP conserva los indicadores financieros."""

        content = build_analytics_zip(sample_report())

        with ZipFile(BytesIO(content)) as archive:
            rows = read_csv(
                archive.read(expected_name("kpis"))
            )

        self.assertEqual(rows[1][0], "12537.45")
        self.assertEqual(rows[1][1], "11")
        self.assertEqual(rows[1][2], "4")
        self.assertEqual(rows[1][3], "50")

    def test_zip_integrity(self):
        """Los archivos comprimidos no están corruptos."""

        content = build_analytics_zip(sample_report())

        with ZipFile(BytesIO(content)) as archive:
            self.assertIsNone(archive.testzip())

    def test_utf8_bom(self):
        """Todos los CSV conservan UTF-8 con BOM."""

        content = build_analytics_zip(sample_report())

        with ZipFile(BytesIO(content)) as archive:
            for filename in archive.namelist():
                with self.subTest(filename=filename):
                    self.assertTrue(
                        archive.read(filename).startswith(
                            b"\xef\xbb\xbf"
                        )
                    )

    def test_without_comparisons(self):
        """Sin comparación se conserva el CSV vacío."""

        report = sample_report(
            comparisons=False,
            empty_lists=True,
        )

        content = build_analytics_zip(report)

        with ZipFile(BytesIO(content)) as archive:
            rows = read_csv(
                archive.read(
                    expected_name("comparisons")
                )
            )

        self.assertEqual(len(rows), 1)
        self.assertEqual(
            rows[0],
            ANALYTICS_COLUMNS["comparisons"],
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
