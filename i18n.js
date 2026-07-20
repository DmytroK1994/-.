(function () {
  "use strict";

  const LANGUAGE_KEY = "warehouseJournalLanguage";
  const LANGUAGES = ["uk", "en", "ja", "zh", "fr", "de", "ru"];
  const LOCALES = { uk: "uk-UA", en: "en-US", ja: "ja-JP", zh: "zh-CN", fr: "fr-FR", de: "de-DE", ru: "ru-RU" };
  const CATALOG = {
    "Облік залишків": ["Inventory Records", "在庫管理", "库存管理", "Gestion des stocks", "Bestandsverwaltung", "Учёт остатков"],
    "Швидкий підрахунок складу": ["Fast warehouse counting", "倉庫在庫をすばやく集計", "快速仓库盘点", "Comptage rapide du stock", "Schnelle Lagerzählung", "Быстрый подсчёт склада"],
    "Версія": ["Version", "バージョン", "版本", "Version", "Version", "Версия"],
    "Меню": ["Menu", "メニュー", "菜单", "Menu", "Menü", "Меню"],
    "Закрити": ["Close", "閉じる", "关闭", "Fermer", "Schließen", "Закрыть"],
    "Назад": ["Back", "戻る", "返回", "Retour", "Zurück", "Назад"],
    "Поточний підрахунок": ["Current count", "現在の集計", "当前盘点", "Comptage actuel", "Aktuelle Zählung", "Текущий подсчёт"],
    "Історія": ["History", "履歴", "历史", "Historique", "Verlauf", "История"],
    "Історія підрахунків": ["Count history", "集計履歴", "盘点历史", "Historique des comptages", "Zählverlauf", "История подсчётов"],
    "Керування": ["Management", "管理", "管理", "Gestion", "Verwaltung", "Управление"],
    "Про додаток": ["About", "アプリについて", "关于应用", "À propos", "Über die App", "О приложении"],
    "Найменування": ["Items", "品目", "名称", "Articles", "Bezeichnungen", "Наименования"],
    "Налаштування": ["Settings", "設定", "设置", "Paramètres", "Einstellungen", "Настройки"],
    "Додати до підрахунку": ["Add to count", "集計に追加", "添加到盘点", "Ajouter au comptage", "Zur Zählung hinzufügen", "Добавить к подсчёту"],
    "Пошук позиції": ["Search for an item", "品目を検索", "搜索项目", "Rechercher un article", "Position suchen", "Поиск позиции"],
    "Позицію не вибрано": ["No item selected", "品目が選択されていません", "未选择项目", "Aucun article sélectionné", "Keine Position ausgewählt", "Позиция не выбрана"],
    "Піддонів": ["Pallets", "パレット数", "托盘数", "Palettes", "Paletten", "Поддонов"],
    "Кілограмів": ["Kilograms", "キログラム", "千克", "Kilogrammes", "Kilogramm", "Килограммов"],
    "Поштучно": ["By piece", "個数単位", "按件", "À l’unité", "Stückweise", "Поштучно"],
    "Кількість": ["Quantity", "数量", "数量", "Quantité", "Anzahl", "Количество"],
    "Окрема вага": ["Separate weight", "個別重量", "单独重量", "Poids séparé", "Einzelgewicht", "Отдельный вес"],
    "Окрема вага, кг": ["Separate weight, kg", "個別重量（kg）", "单独重量（千克）", "Poids séparé, kg", "Einzelgewicht, kg", "Отдельный вес, кг"],
    "Коментар": ["Comment", "コメント", "备注", "Commentaire", "Kommentar", "Комментарий"],
    "Додати": ["Add", "追加", "添加", "Ajouter", "Hinzufügen", "Добавить"],
    "Редагувати": ["Edit", "編集", "编辑", "Modifier", "Bearbeiten", "Редактировать"],
    "Видалити": ["Delete", "削除", "删除", "Supprimer", "Löschen", "Удалить"],
    "Скасувати": ["Cancel", "キャンセル", "取消", "Annuler", "Abbrechen", "Отмена"],
    "Готово": ["Done", "完了", "完成", "Terminé", "Fertig", "Готово"],
    "Очистити / скасувати": ["Clear / cancel", "クリア／キャンセル", "清除／取消", "Effacer / annuler", "Leeren / abbrechen", "Очистить / отменить"],
    "Зберегти зміни": ["Save changes", "変更を保存", "保存更改", "Enregistrer les modifications", "Änderungen speichern", "Сохранить изменения"],
    "Попередній перегляд документа": ["Document preview", "文書プレビュー", "文档预览", "Aperçu du document", "Dokumentvorschau", "Предпросмотр документа"],
    "Попередній перегляд": ["Preview", "プレビュー", "预览", "Aperçu", "Vorschau", "Предпросмотр"],
    "Друк / PDF": ["Print / PDF", "印刷／PDF", "打印／PDF", "Imprimer / PDF", "Drucken / PDF", "Печать / PDF"],
    "Пошук у поточному підрахунку": ["Search current count", "現在の集計を検索", "搜索当前盘点", "Rechercher dans le comptage actuel", "Aktuelle Zählung durchsuchen", "Поиск в текущем подсчёте"],
    "Позиція та підрахунки": ["Item and calculations", "品目と計算", "项目与计算", "Article et calculs", "Position und Berechnungen", "Позиция и подсчёты"],
    "Загальна вага": ["Total weight", "総重量", "总重量", "Poids total", "Gesamtgewicht", "Общий вес"],
    "Підтвердження": ["Confirmation", "確認", "确认", "Confirmation", "Bestätigung", "Подтверждение"],
    "Підтвердити дію?": ["Confirm this action?", "この操作を実行しますか？", "确认此操作？", "Confirmer cette action ?", "Aktion bestätigen?", "Подтвердить действие?"],
    "Підтвердити": ["Confirm", "確認", "确认", "Confirmer", "Bestätigen", "Подтвердить"],
    "Увага": ["Warning", "注意", "注意", "Attention", "Achtung", "Внимание"],
    "Вибрати": ["Select", "選択", "选择", "Sélectionner", "Auswählen", "Выбрать"],
    "Вибрати все": ["Select all", "すべて選択", "全选", "Tout sélectionner", "Alle auswählen", "Выбрать всё"],
    "Видалити вибране": ["Delete selected", "選択項目を削除", "删除所选", "Supprimer la sélection", "Auswahl löschen", "Удалить выбранное"],
    "Видалити порожні": ["Delete empty", "空の項目を削除", "删除空项", "Supprimer les vides", "Leere löschen", "Удалить пустые"],
    "Очистити все": ["Clear all", "すべて消去", "全部清除", "Tout effacer", "Alles leeren", "Очистить всё"],
    "Назва": ["Name", "名称", "名称", "Nom", "Name", "Название"],
    "Зберегти найменування": ["Save item", "品目を保存", "保存名称", "Enregistrer l’article", "Bezeichnung speichern", "Сохранить наименование"],
    "Масове додавання": ["Bulk add", "一括追加", "批量添加", "Ajout groupé", "Mehrfach hinzufügen", "Массовое добавление"],
    "Додати список": ["Add list", "リストを追加", "添加列表", "Ajouter la liste", "Liste hinzufügen", "Добавить список"],
    "Пошук у найменуваннях": ["Search items", "品目を検索", "搜索名称", "Rechercher des articles", "Bezeichnungen durchsuchen", "Поиск по наименованиям"],
    "Мова застосунку": ["App language", "アプリの言語", "应用语言", "Langue de l’application", "App-Sprache", "Язык приложения"],
    "Мова зміниться в усьому інтерфейсі та документах.": ["The language applies to the entire interface and documents.", "言語は画面全体と文書に適用されます。", "语言将应用于整个界面和文档。", "La langue s’applique à toute l’interface et aux documents.", "Die Sprache gilt für die gesamte Oberfläche und die Dokumente.", "Язык применяется ко всему интерфейсу и документам."],
    "Тема оформлення": ["Appearance", "外観テーマ", "外观主题", "Thème d’affichage", "Darstellung", "Тема оформления"],
    "Кольорова тема": ["Color theme", "カラーテーマ", "颜色主题", "Thème de couleurs", "Farbschema", "Цветовая тема"],
    "Темна": ["Dark", "ダーク", "深色", "Sombre", "Dunkel", "Тёмная"],
    "Бежева": ["Beige", "ベージュ", "米色", "Beige", "Beige", "Бежевая"],
    "Чисто біла": ["Pure white", "ピュアホワイト", "纯白", "Blanc pur", "Reinweiß", "Чисто белая"],
    "Власна тема": ["Custom theme", "カスタムテーマ", "自定义主题", "Thème personnalisé", "Eigenes Farbschema", "Собственная тема"],
    "Редагувати власну тему": ["Edit custom theme", "カスタムテーマを編集", "编辑自定义主题", "Modifier le thème personnalisé", "Eigenes Farbschema bearbeiten", "Редактировать собственную тему"],
    "Фон сторінки": ["Page background", "ページ背景", "页面背景", "Arrière-plan de la page", "Seitenhintergrund", "Фон страницы"],
    "Картки": ["Cards", "カード", "卡片", "Cartes", "Karten", "Карточки"],
    "Основний текст": ["Main text", "メインテキスト", "主要文字", "Texte principal", "Haupttext", "Основной текст"],
    "Другорядний текст": ["Secondary text", "補助テキスト", "次要文字", "Texte secondaire", "Sekundärtext", "Вторичный текст"],
    "Рамки": ["Borders", "枠線", "边框", "Bordures", "Rahmen", "Рамки"],
    "Основні кнопки": ["Primary buttons", "メインボタン", "主要按钮", "Boutons principaux", "Hauptschaltflächen", "Основные кнопки"],
    "Додавання": ["Adding", "追加", "添加", "Ajout", "Hinzufügen", "Добавление"],
    "Редагування": ["Editing", "編集", "编辑", "Modification", "Bearbeiten", "Редактирование"],
    "Видалення": ["Deletion", "削除", "删除", "Suppression", "Löschen", "Удаление"],
    "Скинути власну тему": ["Reset custom theme", "カスタムテーマをリセット", "重置自定义主题", "Réinitialiser le thème personnalisé", "Eigenes Farbschema zurücksetzen", "Сбросить собственную тему"],
    "Скопіювати текст резервної копії": ["Copy backup text", "バックアップのテキストをコピー", "复制备份文本", "Copier le texte de sauvegarde", "Sicherungstext kopieren", "Скопировать текст резервной копии"],
    "Завантажити файл резервної копії": ["Download backup file", "バックアップファイルをダウンロード", "下载备份文件", "Télécharger le fichier de sauvegarde", "Sicherungsdatei herunterladen", "Скачать файл резервной копии"],
    "Імпорт резервної копії": ["Import backup", "バックアップをインポート", "导入备份", "Importer une sauvegarde", "Sicherung importieren", "Импорт резервной копии"],
    "Імпортувати": ["Import", "インポート", "导入", "Importer", "Importieren", "Импортировать"],
    "Повне очищення програми": ["Erase all app data", "アプリの全データを消去", "清除应用全部数据", "Effacer toutes les données", "Alle App-Daten löschen", "Полная очистка программы"],
    "Повернення назад": ["Back navigation", "戻る操作", "返回方式", "Navigation retour", "Zurück-Navigation", "Возврат назад"],
    "Автоматично": ["Automatic", "自動", "自动", "Automatique", "Automatisch", "Автоматически"],
    "Кнопка «Назад»": ["Back button", "「戻る」ボタン", "“返回”按钮", "Bouton « Retour »", "Schaltfläche „Zurück“", "Кнопка «Назад»"],
    "Свайп справа наліво": ["Swipe right to left", "右から左へスワイプ", "从右向左滑动", "Balayer de droite à gauche", "Von rechts nach links wischen", "Свайп справа налево"],
    "Інструкція встановлення": ["Installation guide", "インストール手順", "安装说明", "Guide d’installation", "Installationsanleitung", "Инструкция по установке"],
    "Встановити застосунок": ["Install app", "アプリをインストール", "安装应用", "Installer l’application", "App installieren", "Установить приложение"],
    "Поділитися застосунком": ["Share app", "アプリを共有", "分享应用", "Partager l’application", "App teilen", "Поделиться приложением"],
    "Основні можливості": ["Main features", "主な機能", "主要功能", "Fonctions principales", "Hauptfunktionen", "Основные возможности"],
    "Що нового у версії": ["What’s new in version", "このバージョンの新機能", "此版本的新功能", "Nouveautés de la version", "Neu in Version", "Что нового в версии"],
    "Додано українську, англійську, японську, китайську, французьку, німецьку та російську мови.": ["Ukrainian, English, Japanese, Chinese, French, German, and Russian have been added.", "ウクライナ語、英語、日本語、中国語、フランス語、ドイツ語、ロシア語を追加しました。", "新增乌克兰语、英语、日语、中文、法语、德语和俄语。", "L’ukrainien, l’anglais, le japonais, le chinois, le français, l’allemand et le russe ont été ajoutés.", "Ukrainisch, Englisch, Japanisch, Chinesisch, Französisch, Deutsch und Russisch wurden hinzugefügt.", "Добавлены украинский, английский, японский, китайский, французский, немецкий и русский языки."],
    "Встановлення та поширення": ["Installation and sharing", "インストールと共有", "安装与分享", "Installation et partage", "Installation und Teilen", "Установка и распространение"],
    "Перевірити оновлення": ["Check for updates", "更新を確認", "检查更新", "Rechercher des mises à jour", "Nach Updates suchen", "Проверить обновления"],
    "Редагування позиції": ["Edit item", "品目を編集", "编辑项目", "Modifier l’article", "Position bearbeiten", "Редактирование позиции"],
    "Кілограмів у піддоні": ["Kilograms per pallet", "パレット当たりkg", "每托盘千克数", "Kilogrammes par palette", "Kilogramm pro Palette", "Килограммов в поддоне"],
    "Кількість штук": ["Number of pieces", "個数", "件数", "Nombre d’unités", "Stückzahl", "Количество штук"],
    "Кілограмів у штуці": ["Kilograms per piece", "1個当たりkg", "每件千克数", "Kilogrammes par unité", "Kilogramm pro Stück", "Килограммов в штуке"],
    "Введи числа та обери дію": ["Enter numbers and choose an operation", "数値を入力して演算を選択", "输入数字并选择运算", "Saisissez les nombres et choisissez une opération", "Zahlen eingeben und Rechenart wählen", "Введите числа и выберите действие"],
    "Перевір вираз": ["Check the expression", "式を確認してください", "请检查表达式", "Vérifiez l’expression", "Ausdruck prüfen", "Проверьте выражение"],
    "Сума має бути більшою за нуль": ["The total must be greater than zero", "合計は0より大きくしてください", "总数必须大于零", "Le total doit être supérieur à zéro", "Die Summe muss größer als null sein", "Сумма должна быть больше нуля"],
    "Записів немає.": ["No entries.", "記録がありません。", "暂无记录。", "Aucune entrée.", "Keine Einträge.", "Записей нет."],
    "Записів ще немає.": ["No entries yet.", "まだ記録がありません。", "暂无记录。", "Aucune entrée pour le moment.", "Noch keine Einträge.", "Записей пока нет."],
    "Нічого не знайдено": ["Nothing found", "見つかりません", "未找到结果", "Aucun résultat", "Nichts gefunden", "Ничего не найдено"],
    "Відредаговано": ["Edited", "編集済み", "已编辑", "Modifié", "Bearbeitet", "Отредактировано"],
    "підд.": ["pallets", "パレット", "托盘", "palettes", "Pal.", "подд."],
    "шт": ["pcs", "個", "件", "unités", "Stk.", "шт"],
    "Свайпни вправо, щоб відкрити меню": ["Swipe right to open the menu", "右へスワイプしてメニューを開く", "向右滑动打开菜单", "Balayez vers la droite pour ouvrir le menu", "Nach rechts wischen, um das Menü zu öffnen", "Свайпните вправо, чтобы открыть меню"],
    "Свайпни вліво або вправо, щоб закрити меню": ["Swipe left or right to close the menu", "左右にスワイプしてメニューを閉じる", "向左或向右滑动关闭菜单", "Balayez à gauche ou à droite pour fermer le menu", "Nach links oder rechts wischen, um das Menü zu schließen", "Свайпните влево или вправо, чтобы закрыть меню"],
    "Затисни й веди вгору або вниз · один дотик — відкрити": ["Hold and move up or down · tap once to open", "長押しして上下に移動・1回タップで開く", "按住并上下移动 · 单击打开", "Maintenez et glissez vers le haut ou le bas · touchez une fois pour ouvrir", "Gedrückt halten und nach oben oder unten bewegen · einmal tippen zum Öffnen", "Зажмите и ведите вверх или вниз · одно нажатие — открыть"],
    "Проведи вгору або вниз, щоб вибрати пункт": ["Move up or down to select an item", "上下に動かして項目を選択", "上下滑动选择项目", "Glissez vers le haut ou le bas pour sélectionner", "Nach oben oder unten bewegen, um einen Punkt auszuwählen", "Проведите вверх или вниз, чтобы выбрать пункт"],
    "Новий підрахунок": ["New count", "新しい集計", "新建盘点", "Nouveau comptage", "Neue Zählung", "Новый подсчёт"],
    "Створити новий підрахунок?": ["Create a new count?", "新しい集計を作成しますか？", "创建新盘点？", "Créer un nouveau comptage ?", "Neue Zählung erstellen?", "Создать новый подсчёт?"],
    "Створити": ["Create", "作成", "创建", "Créer", "Erstellen", "Создать"],
    "Створено новий підрахунок": ["New count created", "新しい集計を作成しました", "已创建新盘点", "Nouveau comptage créé", "Neue Zählung erstellt", "Новый подсчёт создан"],
    "Запис оновлено": ["Entry updated", "記録を更新しました", "记录已更新", "Entrée mise à jour", "Eintrag aktualisiert", "Запись обновлена"],
    "Запис видалено": ["Entry deleted", "記録を削除しました", "记录已删除", "Entrée supprimée", "Eintrag gelöscht", "Запись удалена"],
    "Найменування додано": ["Item added", "品目を追加しました", "名称已添加", "Article ajouté", "Bezeichnung hinzugefügt", "Наименование добавлено"],
    "Найменування оновлено": ["Item updated", "品目を更新しました", "名称已更新", "Article mis à jour", "Bezeichnung aktualisiert", "Наименование обновлено"],
    "Найменування видалено": ["Item deleted", "品目を削除しました", "名称已删除", "Article supprimé", "Bezeichnung gelöscht", "Наименование удалено"],
    "Введи вагу або кількість": ["Enter a weight or quantity", "重量または数量を入力してください", "请输入重量或数量", "Saisissez un poids ou une quantité", "Gewicht oder Anzahl eingeben", "Введите вес или количество"],
    "Спочатку додай найменування": ["Add an item name first", "先に品目を追加してください", "请先添加名称", "Ajoutez d’abord un article", "Zuerst eine Bezeichnung hinzufügen", "Сначала добавьте наименование"],
    "Перевір вираз окремої ваги": ["Check the separate-weight expression", "個別重量の式を確認してください", "请检查单独重量表达式", "Vérifiez l’expression du poids séparé", "Ausdruck für das Einzelgewicht prüfen", "Проверьте выражение отдельного веса"],
    "Тему змінено": ["Theme changed", "テーマを変更しました", "主题已更改", "Thème modifié", "Farbschema geändert", "Тема изменена"],
    "Власну тему збережено": ["Custom theme saved", "カスタムテーマを保存しました", "自定义主题已保存", "Thème personnalisé enregistré", "Eigenes Farbschema gespeichert", "Собственная тема сохранена"],
    "Спосіб повернення змінено": ["Back navigation changed", "戻る操作を変更しました", "返回方式已更改", "Mode de retour modifié", "Zurück-Navigation geändert", "Способ возврата изменён"],
    "Текст резервної копії скопійовано": ["Backup text copied", "バックアップのテキストをコピーしました", "备份文本已复制", "Texte de sauvegarde copié", "Sicherungstext kopiert", "Текст резервной копии скопирован"],
    "Файл резервної копії створено": ["Backup file created", "バックアップファイルを作成しました", "备份文件已创建", "Fichier de sauvegarde créé", "Sicherungsdatei erstellt", "Файл резервной копии создан"],
    "Імпортовано": ["Imported", "インポートしました", "已导入", "Importé", "Importiert", "Импортировано"],
    "Перевірка оновлення виконана": ["Update check completed", "更新確認が完了しました", "更新检查完成", "Recherche de mise à jour terminée", "Update-Prüfung abgeschlossen", "Проверка обновлений выполнена"]
  };

  const PREFIXES = {
    "Вибрано: ": ["Selected: ", "選択中：", "已选择：", "Sélectionné : ", "Ausgewählt: ", "Выбрано: "],
    "Разом: ": ["Total: ", "合計：", "总计：", "Total : ", "Summe: ", "Итого: "],
    "Окремо: ": ["Separate: ", "個別：", "单独：", "Séparément : ", "Einzeln: ", "Отдельно: "],
    "Залишки на ": ["Stock as of ", "在庫日：", "库存日期：", "Stocks au ", "Bestand am ", "Остатки на "],
    "Поточний підрахунок: ": ["Current count: ", "現在の集計：", "当前盘点：", "Comptage actuel : ", "Aktuelle Zählung: ", "Текущий подсчёт: "],
    "Створено: ": ["Created: ", "作成日時：", "创建时间：", "Créé : ", "Erstellt: ", "Создано: "],
    "Записів: ": ["Entries: ", "記録数：", "记录数：", "Entrées : ", "Einträge: ", "Записей: "],
    "Додано: ": ["Added: ", "追加：", "已添加：", "Ajoutés : ", "Hinzugefügt: ", "Добавлено: "]
  };

  let language = "uk";
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (LANGUAGES.includes(saved)) language = saved;
  } catch (error) {}

  const textState = new WeakMap();
  const attributeState = new WeakMap();

  function translated(source) {
    if (language === "uk") return source;
    const index = LANGUAGES.indexOf(language) - 1;
    const exact = CATALOG[source];
    if (exact && exact[index]) return exact[index];
    for (const [prefix, values] of Object.entries(PREFIXES)) {
      if (source.startsWith(prefix)) return values[index] + source.slice(prefix.length);
    }
    return source;
  }

  function shouldSkip(node) {
    const parent = node.parentElement;
    return !parent || Boolean(parent.closest(
      "script, style, [data-no-translate], #todayList .name, #productsList .name, " +
      "#productSearchResults .combo-option, .print-position-cell .name, #quickEditTitle"
    ));
  }

  function translateTextNode(node) {
    if (shouldSkip(node) || !node.nodeValue || !node.nodeValue.trim()) return;
    let state = textState.get(node);
    if (!state || node.nodeValue !== state.rendered) state = { source: node.nodeValue, rendered: node.nodeValue };
    const leading = state.source.match(/^\s*/)[0];
    const trailing = state.source.match(/\s*$/)[0];
    const core = state.source.trim();
    state.rendered = leading + translated(core) + trailing;
    textState.set(node, state);
    if (node.nodeValue !== state.rendered) node.nodeValue = state.rendered;
  }

  function translateAttributes(element) {
    if (!(element instanceof Element) || element.closest("[data-no-translate]")) return;
    let state = attributeState.get(element) || {};
    ["placeholder", "aria-label", "title"].forEach(attribute => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      const previous = state[attribute];
      if (!previous || current !== previous.rendered) state[attribute] = { source: current, rendered: current };
      state[attribute].rendered = translated(state[attribute].source);
      if (current !== state[attribute].rendered) element.setAttribute(attribute, state[attribute].rendered);
    });
    attributeState.set(element, state);
  }

  function translateTree(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element) translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else translateAttributes(node);
    }
  }

  function setLanguage(nextLanguage, persist = true) {
    language = LANGUAGES.includes(nextLanguage) ? nextLanguage : "uk";
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    if (persist) {
      try { localStorage.setItem(LANGUAGE_KEY, language); } catch (error) {}
    }
    const select = document.getElementById("languageSelect");
    if (select) select.value = language;
    document.title = translated("Облік залишків");
    translateTree(document.body);
    window.dispatchEvent(new CustomEvent("app-language-change", { detail: { language, locale: LOCALES[language] } }));
  }

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === "characterData") translateTextNode(mutation.target);
      mutation.addedNodes.forEach(translateTree);
    });
  });

  function init() {
    setLanguage(language, false);
    const select = document.getElementById("languageSelect");
    if (select) select.addEventListener("change", event => setLanguage(event.target.value));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.AppI18n = {
    get language() { return language; },
    get locale() { return LOCALES[language] || LOCALES.uk; },
    t: translated,
    setLanguage
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
