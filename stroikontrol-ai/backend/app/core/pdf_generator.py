"""
PDF Report Generator for StroyKontrol AI
"""
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

from fpdf import FPDF
import cv2
import numpy as np

# Russian font support
FONT_DIR = Path(__file__).parent.parent.parent / "assets" / "fonts"

class StroyKontrolPDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format='A4')
        self.set_auto_page_break(auto=True, margin=15)
        self.add_page()
        
        # Try to load a font with Cyrillic support
        # Common system fonts with Cyrillic
        system_fonts = [
            ("C:/Windows/Fonts/arial.ttf", "Arial"),
            ("C:/Windows/Fonts/tahoma.ttf", "Tahoma"),
            ("C:/Windows/Fonts/calibri.ttf", "Calibri"),
            ("C:/Windows/Fonts/verdana.ttf", "Verdana"),
        ]
        
        self.font_loaded = False
        for font_path, font_name in system_fonts:
            if os.path.exists(font_path):
                self.add_font("Custom", "", font_path, uni=True)
                self.add_font("Custom", "B", font_path, uni=True)
                self.font_loaded = True
                break
        
        if not self.font_loaded:
            # Fallback to standard font
            self.set_font("Helvetica", '', 11)
    
    def set_custom_font(self, style='', size=11):
        if self.font_loaded:
            self.set_font("Custom", style, size)
        else:
            self.set_font("Helvetica", style, size)


def generate_pdf_report(
    output_path: str,
    project_info: Dict,
    analysis_result: Dict,
    photo_paths: List[str] = None,
    logo_path: Optional[str] = None
):
    """Generate a professional PDF report.
    
    Args:
        output_path: Path to save PDF
        project_info: {title, room_type, surface_type, created_at, id}
        analysis_result: {overall_score, defects, recommendation, combined}
        photo_paths: List of photo file paths to include
        logo_path: Path to logo image
    """
    pdf = StroyKontrolPDF()
    
    # ---- HEADER ----
    if logo_path and os.path.exists(logo_path):
        pdf.image(logo_path, x=10, y=10, w=30)
    
    pdf.set_custom_font('B', 18)
    pdf.cell(0, 12, 'СтройКонтроль AI', ln=True, align='C')
    pdf.set_custom_font('', 11)
    pdf.cell(0, 6, 'Отчёт об автоматизированной проверке качества укладки', ln=True, align='C')
    pdf.cell(0, 6, 'плиточных покрытий', ln=True, align='C')
    pdf.ln(5)
    
    # ---- PROJECT INFO ----
    pdf.set_fill_color(240, 248, 255)
    pdf.rect(10, pdf.get_y(), 190, 35, 'F')
    pdf.set_xy(15, pdf.get_y() + 3)
    
    pdf.set_custom_font('B', 12)
    pdf.cell(0, 8, 'Информация об объекте', ln=True)
    pdf.set_custom_font('', 10)
    
    info = project_info
    pdf.cell(90, 6, f'Проект: {info.get("title", "—")}', ln=0)
    pdf.cell(0, 6, f'ID: {str(info.get("id", "—"))[:8]}', ln=True)
    pdf.cell(90, 6, f'Помещение: {info.get("room_type", "—")}', ln=0)
    pdf.cell(0, 6, f'Поверхность: {info.get("surface_type", "—")}', ln=True)
    pdf.cell(0, 6, f'Дата анализа: {datetime.now().strftime("%d.%m.%Y %H:%M")}', ln=True)
    pdf.ln(8)
    
    # ---- OVERALL SCORE ----
    score = analysis_result.get('overall_score', 0)
    prediction = analysis_result.get('combined', {}).get('prediction', 'unknown')
    
    # Score color
    if score < 30:
        color = (16, 185, 129)  # green
        verdict = 'КАЧЕСТВО В НОРМЕ'
        verdict_bg = (236, 253, 245)
    elif score < 70:
        color = (245, 158, 11)  # yellow
        verdict = 'ТРЕБУЕТСЯ ПРОВЕРКА'
        verdict_bg = (255, 251, 235)
    else:
        color = (239, 68, 68)  # red
        verdict = 'ОБНАРУЖЕНЫ ДЕФЕКТЫ'
        verdict_bg = (254, 242, 242)
    
    pdf.set_fill_color(*verdict_bg)
    pdf.rect(10, pdf.get_y(), 190, 50, 'F')
    pdf.set_xy(15, pdf.get_y() + 5)
    
    pdf.set_custom_font('B', 14)
    pdf.cell(0, 8, 'Результат анализа', ln=True)
    
    # Big score number
    pdf.set_text_color(*color)
    pdf.set_custom_font('B', 36)
    pdf.cell(60, 20, f'{score:.0f}', ln=0, align='C')
    
    pdf.set_text_color(100, 100, 100)
    pdf.set_custom_font('', 10)
    pdf.cell(0, 8, '/ 100  —  Общий балл риска', ln=True)
    
    pdf.set_text_color(*color)
    pdf.set_custom_font('B', 14)
    pdf.cell(0, 10, verdict, ln=True)
    
    pdf.set_text_color(0, 0, 0)
    pdf.ln(5)
    
    # ---- METRICS ----
    pdf.set_custom_font('B', 12)
    pdf.cell(0, 10, 'Метрики анализа', ln=True)
    pdf.set_custom_font('', 10)
    
    combined = analysis_result.get('combined', {})
    metrics = [
        ('Визуальные дефекты', f'{(combined.get("defect_probability", 0) * 100):.1f}%'),
        ('Отслоение плитки', f'{(combined.get("debond_probability", 0) * 100):.1f}%'),
        ('Время обработки', f'{analysis_result.get("processing_time_seconds", 0):.1f} сек'),
        ('Количество дефектов', str(len(analysis_result.get('defects', [])))),
    ]
    
    for label, value in metrics:
        pdf.set_fill_color(245, 245, 245)
        pdf.cell(95, 8, f'  {label}', ln=0, fill=True)
        pdf.cell(0, 8, f'{value}  ', ln=True, align='R', fill=True)
        pdf.ln(1)
    
    pdf.ln(5)
    
    # ---- RECOMMENDATION ----
    rec = analysis_result.get('recommendation', '')
    if rec:
        pdf.set_fill_color(239, 246, 255)
        pdf.rect(10, pdf.get_y(), 190, 25, 'F')
        pdf.set_xy(15, pdf.get_y() + 3)
        pdf.set_custom_font('B', 11)
        pdf.cell(0, 7, 'Рекомендация', ln=True)
        pdf.set_custom_font('', 10)
        pdf.multi_cell(0, 6, rec)
        pdf.ln(5)
    
    # ---- DEFECTS TABLE ----
    defects = analysis_result.get('defects', [])
    if defects:
        pdf.add_page()
        pdf.set_custom_font('B', 14)
        pdf.cell(0, 10, 'Обнаруженные дефекты', ln=True)
        pdf.ln(2)
        
        # Table header
        pdf.set_fill_color(37, 99, 235)
        pdf.set_text_color(255, 255, 255)
        pdf.set_custom_font('B', 9)
        pdf.cell(45, 10, '  Тип дефекта', ln=0, fill=True)
        pdf.cell(35, 10, 'Серьёзность', ln=0, fill=True, align='C')
        pdf.cell(35, 10, 'Уверенность', ln=0, fill=True, align='C')
        pdf.cell(35, 10, 'Измерение', ln=0, fill=True, align='C')
        pdf.cell(40, 10, 'Нормативы  ', ln=True, fill=True, align='C')
        
        # Defect rows
        severity_colors = {
            'critical': (254, 242, 242),
            'warning': (255, 251, 235),
            'info': (243, 244, 246),
        }
        severity_labels = {
            'critical': 'БРАК',
            'warning': 'ПРОВЕРИТЬ',
            'info': 'ИНФО',
        }
        
        DEFECT_NAMES = {
            'uneven_joint': 'Неровный шов',
            'step_height': 'Ступенчатость',
            'missing_joint': 'Пропущенный шов',
            'chip': 'Скол',
            'crack': 'Трещина',
            'void': 'Пустота / отслоение',
            'stain': 'Пятно',
        }
        
        pdf.set_text_color(0, 0, 0)
        for d in defects:
            sev = d.get('severity', 'info')
            bg = severity_colors.get(sev, (243, 244, 246))
            pdf.set_fill_color(*bg)
            
            name = DEFECT_NAMES.get(d.get('defect_type', 'unknown'), d.get('defect_type', 'unknown'))
            conf = d.get('confidence', 0)
            measured = d.get('measured_value_mm')
            threshold = d.get('threshold_mm')
            regs = ', '.join(d.get('regulation_refs', [])[:2])
            
            pdf.set_custom_font('', 9)
            pdf.cell(45, 10, f'  {name}', ln=0, fill=True)
            pdf.set_custom_font('B', 9)
            pdf.cell(35, 10, severity_labels.get(sev, sev.upper()), ln=0, fill=True, align='C')
            pdf.set_custom_font('', 9)
            pdf.cell(35, 10, f'{conf*100:.0f}%', ln=0, fill=True, align='C')
            
            if measured is not None:
                measure_text = f'{measured:.1f} мм'
                if threshold:
                    measure_text += f' (≤{threshold})'
            else:
                measure_text = '—'
            pdf.cell(35, 10, measure_text, ln=0, fill=True, align='C')
            pdf.cell(40, 10, f'{regs}  ', ln=True, fill=True, align='C')
            pdf.ln(1)
        
        pdf.ln(5)
    
    # ---- PHOTOS ----
    if photo_paths:
        pdf.add_page()
        pdf.set_custom_font('B', 14)
        pdf.cell(0, 10, 'Фото объекта', ln=True)
        pdf.ln(2)
        
        for i, photo_path in enumerate(photo_paths[:6]):  # max 6 photos
            if os.path.exists(photo_path):
                try:
                    # Resize for PDF
                    img = cv2.imread(photo_path)
                    if img is not None:
                        h, w = img.shape[:2]
                        max_w = 85
                        aspect = h / w
                        display_h = max_w * aspect
                        
                        if i % 2 == 0:
                            pdf.set_x(10)
                        else:
                            pdf.set_x(105)
                        
                        y_before = pdf.get_y()
                        pdf.image(photo_path, x=pdf.get_x(), y=y_before, w=max_w)
                        
                        if i % 2 == 1:
                            pdf.set_y(y_before + display_h + 5)
                        
                        if pdf.get_y() > 250:
                            pdf.add_page()
                except Exception:
                    pass
    
    # ---- FOOTER ----
    pdf.set_y(-30)
    pdf.set_custom_font('', 8)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 5, f'Отчёт сгенерирован {datetime.now().strftime("%d.%m.%Y %H:%M")} | СтройКонтроль AI v2.1', ln=True, align='C')
    pdf.cell(0, 5, 'Данный отчёт носит информационный характер и не является юридически обязывающим документом.', ln=True, align='C')
    
    # Save
    pdf.output(output_path)
    return output_path


if __name__ == '__main__':
    # Example report
    example_data = {
        'project_info': {
            'title': 'Ванная комната, кв. 42',
            'room_type': 'bathroom',
            'surface_type': 'wall',
            'id': 'proj-12345',
        },
        'analysis_result': {
            'overall_score': 42.0,
            'combined': {
                'defect_probability': 0.35,
                'debond_probability': 0.48,
                'risk_score': 42.0,
                'prediction': 'warning',
            },
            'recommendation': 'Обнаружены признаки дефектов. Рекомендуется локальная проверка проблемных зон. Обратите внимание на зоны с повышенной вероятностью отслоения.',
            'processing_time_seconds': 3.2,
            'defects': [
                {
                    'defect_type': 'void',
                    'severity': 'warning',
                    'confidence': 0.87,
                    'measured_value_mm': 2.3,
                    'threshold_mm': 2.0,
                    'regulation_refs': ['СНиП 3.04.01-87', 'СП 71.13330.2017'],
                },
                {
                    'defect_type': 'crack',
                    'severity': 'critical',
                    'confidence': 0.92,
                    'measured_value_mm': 1.8,
                    'threshold_mm': 0.5,
                    'regulation_refs': ['ГОСТ 6787-2001'],
                },
                {
                    'defect_type': 'uneven_joint',
                    'severity': 'info',
                    'confidence': 0.65,
                    'regulation_refs': ['СНиП 3.04.01-87'],
                },
            ],
        },
        'photo_paths': [],
    }
    
    output = Path('reports/example_report.pdf')
    output.parent.mkdir(exist_ok=True)
    generate_pdf_report(
        str(output),
        example_data['project_info'],
        example_data['analysis_result'],
        example_data['photo_paths']
    )
    print(f"Report generated: {output.absolute()}")
