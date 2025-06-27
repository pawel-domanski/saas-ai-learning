import sys
import json
import uuid
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                            QHBoxLayout, QLabel, QPushButton, QTabWidget, 
                            QTreeWidget, QTreeWidgetItem, QDialog, QLineEdit,
                            QTextEdit, QFormLayout, QMessageBox, QComboBox,
                            QListWidget, QListWidgetItem, QRadioButton, QCheckBox)
from PyQt5.QtCore import Qt, QSize
from PyQt5.QtGui import QIcon

class JSONDBManager(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("🎓 JSON Course Manager - Zarządzanie Kursami")
        self.setMinimumSize(1200, 700)
        
        self.parts_data = self.load_json("part.json")
        self.plan_data = self.load_json("plan.json")
        
        self.init_ui()
        
    def clear_layout(self, layout):
        """Pomocnicza funkcja do czyszczenia layoutów"""
        while layout.count():
            child = layout.takeAt(0)
            if child.widget():
                child.widget().deleteLater()
            elif child.layout():
                self.clear_layout(child.layout())
    
    def load_json(self, filename):
        try:
            with open(filename, 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            if filename == "part.json":
                return {"parts": []}
            else:
                return {"data": []}
        except json.JSONDecodeError:
            QMessageBox.critical(self, "Błąd", f"Plik {filename} zawiera nieprawidłowy format JSON.")
            return {"parts": []} if filename == "part.json" else {"data": []}
    
    def save_json(self, filename, data):
        try:
            with open(filename, 'w', encoding='utf-8') as file:
                json.dump(data, file, indent=4, ensure_ascii=False)
            QMessageBox.information(self, "Sukces", f"Zapisano zmiany do pliku {filename}")
        except Exception as e:
            QMessageBox.critical(self, "Błąd", f"Nie udało się zapisać do pliku {filename}: {str(e)}")
    
    def init_ui(self):
        # Uproszczony styl bez problematycznych właściwości
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f0f0f0;
            }
            QTreeWidget {
                background-color: white;
                border: 1px solid #ccc;
                font-size: 13px;
                alternate-background-color: #f9f9f9;
            }
            QTreeWidget::item {
                padding: 4px;
                min-height: 20px;
            }
            QTreeWidget::item:selected {
                background-color: #0078d4;
                color: white;
            }
            QPushButton {
                background-color: #0078d4;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 3px;
                font-size: 12px;
                min-height: 20px;
                max-height: 30px;
            }
            QPushButton:hover {
                background-color: #106ebe;
            }
            QPushButton:pressed {
                background-color: #005a9e;
            }
            QLineEdit, QTextEdit, QComboBox {
                padding: 4px;
                border: 1px solid #ccc;
                border-radius: 3px;
                font-size: 12px;
                background-color: white;
            }
            QLineEdit:focus, QTextEdit:focus, QComboBox:focus {
                border-color: #0078d4;
            }
            QLabel {
                font-size: 12px;
                color: #333;
            }
            QCheckBox {
                font-size: 12px;
            }
        """)
        
        # Główny widget
        main_widget = QWidget()
        main_layout = QHBoxLayout(main_widget)
        main_layout.setSpacing(5)
        main_layout.setContentsMargins(5, 5, 5, 5)
        
        # Lewy panel - drzewo
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(0, 0, 0, 0)
        
        # Drzewo
        self.tree_widget = QTreeWidget()
        self.tree_widget.setHeaderLabel("📚 Struktura kursu")
        self.tree_widget.setFixedWidth(300)
        self.tree_widget.itemClicked.connect(self.on_item_clicked)
        
        # Główne przyciski akcji
        main_buttons_layout = QHBoxLayout()
        main_buttons_layout.setSpacing(5)
        
        add_part_btn = QPushButton("+ Część")
        add_part_btn.setStyleSheet("QPushButton { background-color: #107c10; }")
        add_part_btn.clicked.connect(self.add_part)
        
        add_chapter_btn = QPushButton("+ Rozdział")
        add_chapter_btn.setStyleSheet("QPushButton { background-color: #ff8c00; }")
        add_chapter_btn.clicked.connect(self.add_chapter)
        
        save_btn = QPushButton("💾 Zapisz")
        save_btn.setStyleSheet("QPushButton { background-color: #d13438; }")
        save_btn.clicked.connect(self.save_changes)
        
        main_buttons_layout.addWidget(add_part_btn)
        main_buttons_layout.addWidget(add_chapter_btn)
        main_buttons_layout.addWidget(save_btn)
        
        left_layout.addWidget(self.tree_widget)
        left_layout.addLayout(main_buttons_layout)
        
        # Prawy panel - szczegóły
        self.details_widget = QWidget()
        self.details_widget.setStyleSheet("background-color: white; border: 1px solid #ccc;")
        self.details_layout = QVBoxLayout(self.details_widget)
        self.details_layout.setContentsMargins(10, 10, 10, 10)
        
        # Domyślna wiadomość
        self.info_label = QLabel("Wybierz element z drzewa, aby zobaczyć szczegóły")
        self.info_label.setStyleSheet("color: #666; font-size: 14px; padding: 20px;")
        self.info_label.setAlignment(Qt.AlignCenter)
        self.details_layout.addWidget(self.info_label)
        
        # Dodaj do głównego layoutu
        main_layout.addWidget(left_panel)
        main_layout.addWidget(self.details_widget, 1)
        
        self.setCentralWidget(main_widget)
        self.load_tree_data()
    
    def load_tree_data(self):
        self.tree_widget.clear()
        
        # Dodaj części z part.json
        for part in self.parts_data.get("parts", []):
            part_item = QTreeWidgetItem(self.tree_widget)
            part_item.setText(0, f"📁 {part.get('name', 'Bez nazwy')}")
            part_item.setData(0, Qt.UserRole, {"type": "part", "id": part.get("id")})
            
            # Dodaj rozdziały z plan.json dla tej części
            for chapter in self.plan_data.get("data", []):
                if chapter.get("part") == part.get("id"):
                    chapter_item = QTreeWidgetItem(part_item)
                    chapter_item.setText(0, f"📖 {chapter.get('subject', 'Bez tematu')}")
                    chapter_item.setData(0, Qt.UserRole, {"type": "chapter", "id": chapter.get("id:")})
                    
                    # Dodaj lekcje do rozdziałów
                    if "lesson" in chapter:
                        lessons_item = QTreeWidgetItem(chapter_item)
                        lessons_item.setText(0, "📚 Lekcje")
                        lessons_item.setData(0, Qt.UserRole, {"type": "lessons_container", "id": chapter.get("id:")})
                        
                        for lesson in chapter.get("lesson", []):
                            lesson_item = QTreeWidgetItem(lessons_item)
                            lesson_item.setText(0, f"📝 {lesson.get('subject', 'Bez tematu')}")
                            lesson_item.setData(0, Qt.UserRole, {"type": "lesson", "id": None})
                    
                    # Dodaj pytania do rozdziałów
                    if "questions" in chapter:
                        questions_item = QTreeWidgetItem(chapter_item)
                        questions_item.setText(0, "❓ Pytania")
                        questions_item.setData(0, Qt.UserRole, {"type": "questions_container", "id": chapter.get("id:")})
                        
                        for question_set in chapter.get("questions", []):
                            question_set_item = QTreeWidgetItem(questions_item)
                            question_set_item.setText(0, f"🧩 {question_set.get('subject', 'Bez tematu')}")
                            question_set_item.setData(0, Qt.UserRole, {"type": "question_set", "id": None})
        
        self.tree_widget.expandAll()
    
    def on_item_clicked(self, item, column):
        data = item.data(0, Qt.UserRole)
        if not data:
            return
        
        # Wyczyść layout szczegółów
        self.clear_details_layout()
        
        item_type = data.get("type")
        item_id = data.get("id")
        
        if item_type == "part":
            self.show_part_details(item_id)
        elif item_type == "chapter":
            self.show_chapter_details(item_id)
        elif item_type == "lesson":
            self.show_lesson_details(item, item_id)
        elif item_type == "question_set":
            self.show_question_set_details(item)
    
    def clear_details_layout(self):
        """Wyczyść layout szczegółów"""
        while self.details_layout.count():
            child = self.details_layout.takeAt(0)
            if child.widget():
                child.widget().deleteLater()
    
    def show_part_details(self, part_id):
        part = None
        for p in self.parts_data.get("parts", []):
            if p.get("id") == part_id:
                part = p
                break
        
        if not part:
            return
        
        # Nagłówek
        header = QLabel(f"📁 Część: {part.get('name', 'Bez nazwy')}")
        header.setStyleSheet("font-size: 16px; font-weight: bold; color: #0078d4; margin-bottom: 10px;")
        self.details_layout.addWidget(header)
        
        # Formularz
        form_widget = QWidget()
        form_layout = QFormLayout(form_widget)
        form_layout.setSpacing(8)
        
        name_edit = QLineEdit(part.get("name", ""))
        icon_edit = QLineEdit(part.get("icon", ""))
        image_edit = QLineEdit(part.get("image", ""))
        ocena_checkbox = QCheckBox()
        ocena_checkbox.setChecked(part.get("ocena", True))
        
        form_layout.addRow("Nazwa:", name_edit)
        form_layout.addRow("Ikona:", icon_edit)
        form_layout.addRow("Obraz:", image_edit)
        form_layout.addRow("Ocena:", ocena_checkbox)
        
        self.details_layout.addWidget(form_widget)
        
        # Przyciski akcji
        buttons_widget = QWidget()
        buttons_layout = QHBoxLayout(buttons_widget)
        buttons_layout.setSpacing(5)
        
        update_btn = QPushButton("Aktualizuj")
        update_btn.setStyleSheet("QPushButton { background-color: #107c10; }")
        
        delete_btn = QPushButton("Usuń")
        delete_btn.setStyleSheet("QPushButton { background-color: #d13438; }")
        
        add_chapter_btn = QPushButton("+ Dodaj rozdział")
        add_chapter_btn.setStyleSheet("QPushButton { background-color: #ff8c00; }")
        
        def update_part():
            part["name"] = name_edit.text()
            part["icon"] = icon_edit.text()
            part["image"] = image_edit.text()
            part["ocena"] = ocena_checkbox.isChecked()
            self.load_tree_data()
            QMessageBox.information(self, "Sukces", "Zaktualizowano część")
        
        def delete_part():
            reply = QMessageBox.question(self, "Potwierdzenie", 
                                         "Czy na pewno chcesz usunąć tę część?",
                                         QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            if reply == QMessageBox.Yes:
                self.parts_data["parts"] = [p for p in self.parts_data["parts"] if p.get("id") != part_id]
                self.plan_data["data"] = [c for c in self.plan_data["data"] if c.get("part") != part_id]
                self.load_tree_data()
                self.clear_details_layout()
                QMessageBox.information(self, "Sukces", "Usunięto część")
        
        update_btn.clicked.connect(update_part)
        delete_btn.clicked.connect(delete_part)
        add_chapter_btn.clicked.connect(self.add_chapter)
        
        buttons_layout.addWidget(update_btn)
        buttons_layout.addWidget(delete_btn)
        buttons_layout.addWidget(add_chapter_btn)
        buttons_layout.addStretch()
        
        self.details_layout.addWidget(buttons_widget)
        self.details_layout.addStretch()
    
    def show_chapter_details(self, chapter_id):
        chapter = None
        for c in self.plan_data.get("data", []):
            if c.get("id:") == chapter_id:
                chapter = c
                break
        
        if not chapter:
            return
        
        # Nagłówek
        header = QLabel(f"📖 Rozdział: {chapter.get('subject', 'Bez tematu')}")
        header.setStyleSheet("font-size: 16px; font-weight: bold; color: #0078d4; margin-bottom: 10px;")
        self.details_layout.addWidget(header)
        
        # Formularz
        form_widget = QWidget()
        form_layout = QFormLayout(form_widget)
        form_layout.setSpacing(8)
        
        subject_edit = QLineEdit(chapter.get("subject", ""))
        desc_edit = QTextEdit(chapter.get("desc", ""))
        desc_edit.setMaximumHeight(80)
        
        part_combo = QComboBox()
        for part in self.parts_data.get("parts", []):
            part_combo.addItem(part.get("name", ""), part.get("id"))
        
        current_part_index = -1
        for i in range(part_combo.count()):
            if part_combo.itemData(i) == chapter.get("part"):
                current_part_index = i
                break
        
        if current_part_index >= 0:
            part_combo.setCurrentIndex(current_part_index)
        
        image_edit = QLineEdit(chapter.get("image", ""))
        ocena_checkbox = QCheckBox()
        ocena_checkbox.setChecked(chapter.get("ocena", True))
        
        content_edit = QTextEdit(chapter.get("content", ""))
        content_edit.setMaximumHeight(120)
        
        form_layout.addRow("Temat:", subject_edit)
        form_layout.addRow("Opis:", desc_edit)
        form_layout.addRow("Część:", part_combo)
        form_layout.addRow("Obraz:", image_edit)
        form_layout.addRow("Ocena:", ocena_checkbox)
        form_layout.addRow("Treść:", content_edit)
        
        self.details_layout.addWidget(form_widget)
        
        # Przyciski akcji
        buttons_widget = QWidget()
        buttons_layout = QHBoxLayout(buttons_widget)
        buttons_layout.setSpacing(5)
        
        update_btn = QPushButton("Aktualizuj")
        update_btn.setStyleSheet("QPushButton { background-color: #107c10; }")
        
        delete_btn = QPushButton("Usuń")
        delete_btn.setStyleSheet("QPushButton { background-color: #d13438; }")
        
        add_lesson_btn = QPushButton("+ Lekcja")
        add_lesson_btn.setStyleSheet("QPushButton { background-color: #9c27b0; }")
        
        add_question_btn = QPushButton("+ Pytania")
        add_question_btn.setStyleSheet("QPushButton { background-color: #f44336; }")
        
        def update_chapter():
            chapter["subject"] = subject_edit.text()
            chapter["desc"] = desc_edit.toPlainText()
            chapter["part"] = part_combo.currentData()
            chapter["image"] = image_edit.text()
            chapter["ocena"] = ocena_checkbox.isChecked()
            chapter["content"] = content_edit.toPlainText()
            self.load_tree_data()
            QMessageBox.information(self, "Sukces", "Zaktualizowano rozdział")
        
        def delete_chapter():
            reply = QMessageBox.question(self, "Potwierdzenie", 
                                         "Czy na pewno chcesz usunąć ten rozdział?",
                                         QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            if reply == QMessageBox.Yes:
                self.plan_data["data"] = [c for c in self.plan_data["data"] if c.get("id:") != chapter_id]
                self.load_tree_data()
                self.clear_details_layout()
                QMessageBox.information(self, "Sukces", "Usunięto rozdział")
        
        update_btn.clicked.connect(update_chapter)
        delete_btn.clicked.connect(delete_chapter)
        add_lesson_btn.clicked.connect(self.add_lesson)
        add_question_btn.clicked.connect(self.add_question)
        
        buttons_layout.addWidget(update_btn)
        buttons_layout.addWidget(delete_btn)
        buttons_layout.addWidget(add_lesson_btn)
        buttons_layout.addWidget(add_question_btn)
        buttons_layout.addStretch()
        
        self.details_layout.addWidget(buttons_widget)
        self.details_layout.addStretch()
    
    def show_lesson_details(self, item, lesson_id):
        parent_item = item.parent()
        if not parent_item:
            return
        
        chapter_item = parent_item.parent()
        if not chapter_item:
            return
        
        chapter_data = chapter_item.data(0, Qt.UserRole)
        if not chapter_data or chapter_data.get("type") != "chapter":
            return
        
        chapter_id = chapter_data.get("id")
        if not chapter_id:
            return
        
        chapter = None
        for c in self.plan_data.get("data", []):
            if c.get("id:") == chapter_id:
                chapter = c
                break
        
        if not chapter:
            return
        
        lesson_index = parent_item.indexOfChild(item)
        if lesson_index < 0 or lesson_index >= len(chapter.get("lesson", [])):
            return
        
        lesson = chapter["lesson"][lesson_index]
        
        # Nagłówek
        header = QLabel(f"📝 Lekcja: {lesson.get('subject', 'Bez tematu')}")
        header.setStyleSheet("font-size: 16px; font-weight: bold; color: #0078d4; margin-bottom: 10px;")
        self.details_layout.addWidget(header)
        
        # Formularz
        form_widget = QWidget()
        form_layout = QFormLayout(form_widget)
        form_layout.setSpacing(8)
        
        # ID (tylko do odczytu)
        id_edit = QLineEdit(lesson.get("id", ""))
        id_edit.setReadOnly(True)
        id_edit.setStyleSheet("background-color: #f0f0f0; color: #666;")
        
        subject_edit = QLineEdit(lesson.get("subject", ""))
        desc_edit = QTextEdit(lesson.get("desc", ""))
        desc_edit.setMaximumHeight(80)
        
        # Image i Content (tylko do odczytu - automatycznie generowane)
        image_edit = QLineEdit(lesson.get("image", ""))
        image_edit.setReadOnly(True)
        image_edit.setStyleSheet("background-color: #f0f0f0; color: #666;")
        
        content_edit = QLineEdit(lesson.get("content", ""))
        content_edit.setReadOnly(True)
        content_edit.setStyleSheet("background-color: #f0f0f0; color: #666;")
        
        form_layout.addRow("ID:", id_edit)
        form_layout.addRow("Temat:", subject_edit)
        form_layout.addRow("Opis:", desc_edit)
        form_layout.addRow("Obraz:", image_edit)
        form_layout.addRow("Treść:", content_edit)
        
        self.details_layout.addWidget(form_widget)
        
        # Przyciski akcji
        buttons_widget = QWidget()
        buttons_layout = QHBoxLayout(buttons_widget)
        buttons_layout.setSpacing(5)
        
        update_btn = QPushButton("Aktualizuj")
        update_btn.setStyleSheet("QPushButton { background-color: #107c10; }")
        
        delete_btn = QPushButton("Usuń")
        delete_btn.setStyleSheet("QPushButton { background-color: #d13438; }")
        
        copy_id_btn = QPushButton("Kopiuj ID")
        copy_id_btn.setStyleSheet("QPushButton { background-color: #ff8c00; }")
        
        def update_lesson():
            lesson["subject"] = subject_edit.text()
            lesson["desc"] = desc_edit.toPlainText()
            # Image i content nie są edytowalne - pozostają automatycznie generowane
            self.load_tree_data()
            QMessageBox.information(self, "Sukces", "Zaktualizowano lekcję")
        
        def delete_lesson():
            reply = QMessageBox.question(self, "Potwierdzenie", 
                                         "Czy na pewno chcesz usunąć tę lekcję?",
                                         QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            if reply == QMessageBox.Yes:
                chapter["lesson"].pop(lesson_index)
                self.load_tree_data()
                self.clear_details_layout()
                QMessageBox.information(self, "Sukces", "Usunięto lekcję")
        
        def copy_lesson_id():
            lesson_id = lesson.get("id", "")
            if lesson_id:
                clipboard = QApplication.clipboard()
                clipboard.setText(lesson_id)
                QMessageBox.information(self, "Sukces", f"ID zostało skopiowane do schowka:\n{lesson_id}")
            else:
                QMessageBox.warning(self, "Ostrzeżenie", "Brak ID do skopiowania")
        
        update_btn.clicked.connect(update_lesson)
        delete_btn.clicked.connect(delete_lesson)
        copy_id_btn.clicked.connect(copy_lesson_id)
        
        buttons_layout.addWidget(update_btn)
        buttons_layout.addWidget(delete_btn)
        buttons_layout.addWidget(copy_id_btn)
        buttons_layout.addStretch()
        
        self.details_layout.addWidget(buttons_widget)
        self.details_layout.addStretch()
    
    def show_question_set_details(self, item):
        parent_item = item.parent()
        if not parent_item:
            return
        
        chapter_item = parent_item.parent()
        if not chapter_item:
            return
        
        chapter_data = chapter_item.data(0, Qt.UserRole)
        if not chapter_data or chapter_data.get("type") != "chapter":
            return
        
        chapter_id = chapter_data.get("id")
        if not chapter_id:
            return
        
        chapter = None
        for c in self.plan_data.get("data", []):
            if c.get("id:") == chapter_id:
                chapter = c
                break
        
        if not chapter:
            return
        
        question_set_index = parent_item.indexOfChild(item)
        if question_set_index < 0 or question_set_index >= len(chapter.get("questions", [])):
            return
        
        question_set = chapter["questions"][question_set_index]
        
        # Nagłówek
        header = QLabel(f"❓ Zestaw pytań: {question_set.get('subject', 'Bez tematu')}")
        header.setStyleSheet("font-size: 16px; font-weight: bold; color: #0078d4; margin-bottom: 10px;")
        self.details_layout.addWidget(header)
        
        # Formularz
        form_widget = QWidget()
        form_layout = QFormLayout(form_widget)
        form_layout.setSpacing(8)
        
        subject_edit = QLineEdit(question_set.get("subject", ""))
        desc_edit = QTextEdit(question_set.get("desc", ""))
        desc_edit.setMaximumHeight(80)
        
        form_layout.addRow("Temat:", subject_edit)
        form_layout.addRow("Opis:", desc_edit)
        
        # Informacja o pytaniach
        questions_count = len(question_set.get('questions', []))
        questions_label = QLabel(f"Liczba pytań: {questions_count}")
        questions_label.setStyleSheet("color: #666; font-style: italic;")
        form_layout.addRow("Pytania:", questions_label)
        
        self.details_layout.addWidget(form_widget)
        
        # Przyciski akcji
        buttons_widget = QWidget()
        buttons_layout = QHBoxLayout(buttons_widget)
        buttons_layout.setSpacing(5)
        
        update_btn = QPushButton("Aktualizuj")
        update_btn.setStyleSheet("QPushButton { background-color: #107c10; }")
        
        delete_btn = QPushButton("Usuń")
        delete_btn.setStyleSheet("QPushButton { background-color: #d13438; }")
        
        add_question_btn = QPushButton("+ Dodaj pytanie")
        add_question_btn.setStyleSheet("QPushButton { background-color: #f44336; }")
        
        def update_question_set():
            question_set["subject"] = subject_edit.text()
            question_set["desc"] = desc_edit.toPlainText()
            self.load_tree_data()
            QMessageBox.information(self, "Sukces", "Zaktualizowano zestaw pytań")
        
        def delete_question_set():
            reply = QMessageBox.question(self, "Potwierdzenie", 
                                         "Czy na pewno chcesz usunąć ten zestaw pytań?",
                                         QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            if reply == QMessageBox.Yes:
                chapter["questions"].pop(question_set_index)
                self.load_tree_data()
                self.clear_details_layout()
                QMessageBox.information(self, "Sukces", "Usunięto zestaw pytań")
        
        def add_new_question():
            dialog = QuestionDialog(self)
            if dialog.exec_() == QDialog.Accepted:
                if "questions" not in question_set:
                    question_set["questions"] = []
                
                question_set["questions"].append(dialog.get_question_data())
                self.load_tree_data()
                QMessageBox.information(self, "Sukces", "Dodano nowe pytanie")
        
        update_btn.clicked.connect(update_question_set)
        delete_btn.clicked.connect(delete_question_set)
        add_question_btn.clicked.connect(add_new_question)
        
        buttons_layout.addWidget(update_btn)
        buttons_layout.addWidget(delete_btn)
        buttons_layout.addWidget(add_question_btn)
        buttons_layout.addStretch()
        
        self.details_layout.addWidget(buttons_widget)
        self.details_layout.addStretch()
    
    def add_part(self):
        dialog = QDialog(self)
        dialog.setWindowTitle("Dodaj nową część")
        dialog.setFixedSize(350, 200)
        dialog.setStyleSheet("""
            QDialog { background-color: #f0f0f0; }
            QLabel { font-weight: bold; color: #333; font-size: 12px; }
        """)
        
        layout = QFormLayout(dialog)
        layout.setSpacing(8)
        
        name_edit = QLineEdit()
        icon_edit = QLineEdit()
        image_edit = QLineEdit()
        ocena_checkbox = QCheckBox()
        ocena_checkbox.setChecked(True)
        
        layout.addRow("Nazwa:", name_edit)
        layout.addRow("Ikona:", icon_edit)
        layout.addRow("Obraz:", image_edit)
        layout.addRow("Ocena:", ocena_checkbox)
        
        buttons_layout = QHBoxLayout()
        ok_button = QPushButton("Dodaj")
        ok_button.setStyleSheet("QPushButton { background-color: #107c10; }")
        cancel_button = QPushButton("Anuluj")
        cancel_button.setStyleSheet("QPushButton { background-color: #d13438; }")
        
        buttons_layout.addWidget(ok_button)
        buttons_layout.addWidget(cancel_button)
        
        layout.addRow("", buttons_layout)
        
        ok_button.clicked.connect(dialog.accept)
        cancel_button.clicked.connect(dialog.reject)
        
        if dialog.exec_() == QDialog.Accepted:
            new_part = {
                "id": str(uuid.uuid4()),
                "name": name_edit.text(),
                "icon": icon_edit.text(),
                "image": image_edit.text(),
                "ocena": ocena_checkbox.isChecked()
            }
            
            self.parts_data["parts"].append(new_part)
            self.load_tree_data()
            QMessageBox.information(self, "Sukces", "Dodano nową część")
    
    def add_chapter(self):
        if not self.parts_data.get("parts"):
            QMessageBox.warning(self, "Ostrzeżenie", "Najpierw dodaj część")
            return
        
        # Sprawdź, czy jest wybrany element w drzewie
        selected_items = self.tree_widget.selectedItems()
        selected_part_id = None
        
        if selected_items:
            selected_item = selected_items[0]
            item_data = selected_item.data(0, Qt.UserRole)
            
            if item_data and item_data.get("type") == "part":
                selected_part_id = item_data.get("id")
        
        dialog = QDialog(self)
        dialog.setWindowTitle("Dodaj nowy rozdział")
        dialog.setFixedSize(400, 350)
        dialog.setStyleSheet("""
            QDialog { background-color: #f0f0f0; }
            QLabel { font-weight: bold; color: #333; font-size: 12px; }
        """)
        
        layout = QFormLayout(dialog)
        layout.setSpacing(8)
        
        subject_edit = QLineEdit()
        desc_edit = QTextEdit()
        desc_edit.setMaximumHeight(60)
        
        part_combo = QComboBox()
        selected_index = 0
        for i, part in enumerate(self.parts_data.get("parts", [])):
            part_combo.addItem(part.get("name", ""), part.get("id"))
            if selected_part_id and part.get("id") == selected_part_id:
                selected_index = i
        
        part_combo.setCurrentIndex(selected_index)
        
        image_edit = QLineEdit()
        ocena_checkbox = QCheckBox()
        ocena_checkbox.setChecked(True)
        
        content_edit = QTextEdit()
        content_edit.setMaximumHeight(80)
        
        layout.addRow("Temat:", subject_edit)
        layout.addRow("Opis:", desc_edit)
        layout.addRow("Część:", part_combo)
        layout.addRow("Obraz:", image_edit)
        layout.addRow("Ocena:", ocena_checkbox)
        layout.addRow("Treść:", content_edit)
        
        buttons_layout = QHBoxLayout()
        ok_button = QPushButton("Dodaj")
        ok_button.setStyleSheet("QPushButton { background-color: #107c10; }")
        cancel_button = QPushButton("Anuluj")
        cancel_button.setStyleSheet("QPushButton { background-color: #d13438; }")
        
        buttons_layout.addWidget(ok_button)
        buttons_layout.addWidget(cancel_button)
        
        layout.addRow("", buttons_layout)
        
        ok_button.clicked.connect(dialog.accept)
        cancel_button.clicked.connect(dialog.reject)
        
        if dialog.exec_() == QDialog.Accepted:
            new_chapter = {
                "id:": str(uuid.uuid4()),
                "subject": subject_edit.text(),
                "desc": desc_edit.toPlainText(),
                "part": part_combo.currentData(),
                "image": image_edit.text(),
                "ocena": ocena_checkbox.isChecked(),
                "content": content_edit.toPlainText()
            }
            
            self.plan_data["data"].append(new_chapter)
            self.load_tree_data()
            QMessageBox.information(self, "Sukces", "Dodano nowy rozdział")
    
    def add_lesson(self):
        # Sprawdź, czy jest wybrany element w drzewie
        selected_items = self.tree_widget.selectedItems()
        if not selected_items:
            QMessageBox.warning(self, "Ostrzeżenie", "Wybierz rozdział, do którego chcesz dodać lekcję")
            return
        
        selected_item = selected_items[0]
        item_data = selected_item.data(0, Qt.UserRole)
        
        # Znajdź rozdział
        chapter_item = None
        chapter_id = None
        
        if item_data and item_data.get("type") == "chapter":
            chapter_item = selected_item
            chapter_id = item_data.get("id")
        elif item_data and item_data.get("type") == "lessons_container":
            chapter_item = selected_item.parent()
            chapter_data = chapter_item.data(0, Qt.UserRole)
            chapter_id = chapter_data.get("id") if chapter_data else None
        
        if not chapter_id:
            QMessageBox.warning(self, "Ostrzeżenie", "Wybierz rozdział, do którego chcesz dodać lekcję")
            return
        
        # Znajdź rozdział w danych
        chapter = None
        for c in self.plan_data.get("data", []):
            if c.get("id:") == chapter_id:
                chapter = c
                break
        
        if not chapter:
            QMessageBox.warning(self, "Ostrzeżenie", "Nie znaleziono wybranego rozdziału")
            return
        
        # Dialog dodawania lekcji
        dialog = QDialog(self)
        dialog.setWindowTitle("Dodaj nową lekcję")
        dialog.setFixedSize(400, 200)
        dialog.setStyleSheet("""
            QDialog { background-color: #f0f0f0; }
            QLabel { font-weight: bold; color: #333; font-size: 12px; }
        """)
        
        layout = QFormLayout(dialog)
        layout.setSpacing(8)
        
        subject_edit = QLineEdit()
        desc_edit = QTextEdit()
        desc_edit.setMaximumHeight(100)
        
        layout.addRow("Temat:", subject_edit)
        layout.addRow("Opis:", desc_edit)
        
        buttons_layout = QHBoxLayout()
        ok_button = QPushButton("Dodaj")
        ok_button.setStyleSheet("QPushButton { background-color: #107c10; }")
        cancel_button = QPushButton("Anuluj")
        cancel_button.setStyleSheet("QPushButton { background-color: #d13438; }")
        
        buttons_layout.addWidget(ok_button)
        buttons_layout.addWidget(cancel_button)
        
        layout.addRow("", buttons_layout)
        
        ok_button.clicked.connect(dialog.accept)
        cancel_button.clicked.connect(dialog.reject)
        
        if dialog.exec_() == QDialog.Accepted:
            # Wygeneruj nowe ID
            lesson_id = str(uuid.uuid4())
            
            new_lesson = {
                "id": lesson_id,
                "subject": subject_edit.text(),
                "desc": desc_edit.toPlainText(),
                "image": f"/img/{lesson_id}.png",
                "content": f"{lesson_id}.md"
            }
            
            if "lesson" not in chapter:
                chapter["lesson"] = []
            
            chapter["lesson"].append(new_lesson)
            self.load_tree_data()
            
            # Skopiuj ID do schowka
            clipboard = QApplication.clipboard()
            clipboard.setText(lesson_id)
            
            QMessageBox.information(self, "Sukces", f"Dodano nową lekcję!\nID zostało skopiowane do schowka: {lesson_id}")
    
    def add_question(self):
        # Sprawdź, czy jest wybrany element w drzewie
        selected_items = self.tree_widget.selectedItems()
        if not selected_items:
            QMessageBox.warning(self, "Ostrzeżenie", "Wybierz rozdział, do którego chcesz dodać pytania")
            return
        
        selected_item = selected_items[0]
        item_data = selected_item.data(0, Qt.UserRole)
        
        # Znajdź rozdział
        chapter_item = None
        chapter_id = None
        
        if item_data and item_data.get("type") == "chapter":
            chapter_item = selected_item
            chapter_id = item_data.get("id")
        elif item_data and item_data.get("type") == "questions_container":
            chapter_item = selected_item.parent()
            chapter_data = chapter_item.data(0, Qt.UserRole)
            chapter_id = chapter_data.get("id") if chapter_data else None
        elif item_data and item_data.get("type") == "question_set":
            questions_container = selected_item.parent()
            chapter_item = questions_container.parent()
            chapter_data = chapter_item.data(0, Qt.UserRole)
            chapter_id = chapter_data.get("id") if chapter_data else None
        
        if not chapter_id:
            QMessageBox.warning(self, "Ostrzeżenie", "Wybierz rozdział, do którego chcesz dodać pytania")
            return
        
        # Znajdź rozdział w danych
        chapter = None
        for c in self.plan_data.get("data", []):
            if c.get("id:") == chapter_id:
                chapter = c
                break
        
        if not chapter:
            QMessageBox.warning(self, "Ostrzeżenie", "Nie znaleziono wybranego rozdziału")
            return
        
        # Dialog dodawania zestawu pytań
        dialog = QDialog(self)
        dialog.setWindowTitle("Dodaj nowy zestaw pytań")
        
        layout = QFormLayout(dialog)
        
        subject_edit = QLineEdit()
        desc_edit = QTextEdit()
        desc_edit.setMaximumHeight(100)
        
        layout.addRow("Temat:", subject_edit)
        layout.addRow("Opis:", desc_edit)
        
        buttons_layout = QHBoxLayout()
        ok_button = QPushButton("Dodaj")
        cancel_button = QPushButton("Anuluj")
        
        buttons_layout.addWidget(ok_button)
        buttons_layout.addWidget(cancel_button)
        
        layout.addRow("", buttons_layout)
        
        ok_button.clicked.connect(dialog.accept)
        cancel_button.clicked.connect(dialog.reject)
        
        if dialog.exec_() == QDialog.Accepted:
            new_question_set = {
                "subject": subject_edit.text(),
                "desc": desc_edit.toPlainText(),
                "questions": []
            }
            
            if "questions" not in chapter:
                chapter["questions"] = []
            
            chapter["questions"].append(new_question_set)
            self.load_tree_data()
            QMessageBox.information(self, "Sukces", "Dodano nowy zestaw pytań")
    
    def save_changes(self):
        self.save_json("part.json", self.parts_data)
        self.save_json("plan.json", self.plan_data)

class QuestionDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Dodaj nowe pytanie")
        self.setMinimumWidth(500)
        
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        form_layout = QFormLayout()
        
        self.question_edit = QLineEdit()
        self.hint_edit = QLineEdit()
        self.if_wrong_edit = QLineEdit()
        self.explanation_edit = QTextEdit()
        self.explanation_edit.setMaximumHeight(100)
        
        # Typ pytania
        self.type_combo = QComboBox()
        self.type_combo.addItems(["single_choice", "multi_choice"])
        self.type_combo.currentIndexChanged.connect(self.on_type_changed)
        
        form_layout.addRow("Pytanie:", self.question_edit)
        form_layout.addRow("Podpowiedź:", self.hint_edit)
        form_layout.addRow("Jeśli błędna odpowiedź:", self.if_wrong_edit)
        form_layout.addRow("Wyjaśnienie:", self.explanation_edit)
        form_layout.addRow("Typ pytania:", self.type_combo)
        
        layout.addLayout(form_layout)
        
        # Sekcja odpowiedzi
        answers_label = QLabel("Odpowiedzi:")
        layout.addWidget(answers_label)
        
        self.answers_list = QListWidget()
        layout.addWidget(self.answers_list)
        
        answers_buttons_layout = QHBoxLayout()
        
        add_answer_btn = QPushButton("Dodaj odpowiedź")
        remove_answer_btn = QPushButton("Usuń odpowiedź")
        
        add_answer_btn.clicked.connect(self.add_answer)
        remove_answer_btn.clicked.connect(self.remove_answer)
        
        answers_buttons_layout.addWidget(add_answer_btn)
        answers_buttons_layout.addWidget(remove_answer_btn)
        
        layout.addLayout(answers_buttons_layout)
        
        # Sekcja poprawnych odpowiedzi
        correct_label = QLabel("Poprawne odpowiedzi:")
        layout.addWidget(correct_label)
        
        self.correct_widget = QWidget()
        self.correct_layout = QVBoxLayout(self.correct_widget)
        
        self.single_choice_widget = QWidget()
        self.single_choice_layout = QFormLayout(self.single_choice_widget)
        
        self.correct_combo = QComboBox()
        self.single_choice_layout.addRow("Poprawna odpowiedź:", self.correct_combo)
        
        self.multi_choice_widget = QWidget()
        self.multi_choice_layout = QVBoxLayout(self.multi_choice_widget)
        self.multi_choice_layout.addWidget(QLabel("Zaznacz poprawne odpowiedzi:"))
        
        self.correct_layout.addWidget(self.single_choice_widget)
        self.correct_layout.addWidget(self.multi_choice_widget)
        self.multi_choice_widget.hide()
        
        layout.addWidget(self.correct_widget)
        
        # Przyciski OK/Anuluj
        buttons_layout = QHBoxLayout()
        ok_button = QPushButton("Dodaj")
        cancel_button = QPushButton("Anuluj")
        
        ok_button.clicked.connect(self.accept)
        cancel_button.clicked.connect(self.reject)
        
        buttons_layout.addWidget(ok_button)
        buttons_layout.addWidget(cancel_button)
        
        layout.addLayout(buttons_layout)
    
    def on_type_changed(self, index):
        if index == 0:  # single_choice
            self.single_choice_widget.show()
            self.multi_choice_widget.hide()
        else:  # multi_choice
            self.single_choice_widget.hide()
            self.multi_choice_widget.show()
            self.update_checkboxes()
    
    def add_answer(self):
        dialog = QDialog(self)
        dialog.setWindowTitle("Dodaj odpowiedź")
        
        layout = QFormLayout(dialog)
        
        answer_edit = QLineEdit()
        layout.addRow("Odpowiedź:", answer_edit)
        
        buttons_layout = QHBoxLayout()
        ok_button = QPushButton("Dodaj")
        cancel_button = QPushButton("Anuluj")
        
        ok_button.clicked.connect(dialog.accept)
        cancel_button.clicked.connect(dialog.reject)
        
        buttons_layout.addWidget(ok_button)
        buttons_layout.addWidget(cancel_button)
        
        layout.addRow("", buttons_layout)
        
        if dialog.exec_() == QDialog.Accepted and answer_edit.text():
            self.answers_list.addItem(answer_edit.text())
            self.update_correct_options()
    
    def remove_answer(self):
        selected_items = self.answers_list.selectedItems()
        if not selected_items:
            return
        
        for item in selected_items:
            self.answers_list.takeItem(self.answers_list.row(item))
        
        self.update_correct_options()
    
    def update_correct_options(self):
        # Aktualizacja opcji w ComboBox dla single_choice
        self.correct_combo.clear()
        
        for i in range(self.answers_list.count()):
            self.correct_combo.addItem(self.answers_list.item(i).text(), i)
        
        # Aktualizacja checkboxów dla multi_choice
        self.update_checkboxes()
    
    def update_checkboxes(self):
        # Wyczyść layout
        while self.multi_choice_layout.count():
            child = self.multi_choice_layout.takeAt(0)
            if child.widget():
                child.widget().deleteLater()
        
        self.multi_choice_layout.addWidget(QLabel("Zaznacz poprawne odpowiedzi:"))
        
        # Dodaj checkboxy dla każdej odpowiedzi
        self.checkboxes = []
        for i in range(self.answers_list.count()):
            checkbox = QCheckBox(self.answers_list.item(i).text())
            self.checkboxes.append(checkbox)
            self.multi_choice_layout.addWidget(checkbox)
    
    def get_question_data(self):
        question_type = self.type_combo.currentText()
        
        # Zbierz odpowiedzi
        answers = []
        for i in range(self.answers_list.count()):
            answers.append(self.answers_list.item(i).text())
        
        # Poprawne odpowiedzi
        if question_type == "single_choice":
            correct = self.correct_combo.currentIndex()
            result = {
                "id": str(uuid.uuid4()),
                "question": self.question_edit.text(),
                "type": question_type,
                "hint": self.hint_edit.text(),
                "if_wrong": self.if_wrong_edit.text(),
                "explanation": self.explanation_edit.toPlainText(),
                "correct": correct,
                "answers": answers
            }
        else:  # multi_choice
            correct_indexes = []
            for i, checkbox in enumerate(self.checkboxes):
                if checkbox.isChecked():
                    correct_indexes.append(i)
            
            result = {
                "id": str(uuid.uuid4()),
                "question": self.question_edit.text(),
                "type": question_type,
                "hint": self.hint_edit.text(),
                "if_wrong": self.if_wrong_edit.text(),
                "explanation": self.explanation_edit.toPlainText(),
                "correctIndexes": correct_indexes,
                "answers": answers
            }
        
        return result

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = JSONDBManager()
    window.show()
    sys.exit(app.exec_()) 