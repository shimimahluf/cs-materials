/* Catalog of interactive assignments, shown on assignments/index.html.
   To add an assignment: add an entry here (newest first).
     id       = folder name, and the progress key used by its pages ("csa:<id>")
     requires = id of an assignment that should be done first (optional)
     parts    = one entry per part page; stages = number of stages on that page */
window.CATALOG = [
  {
    id: "wpf-restaurant",
    title: "מסעדה בחלון WPF",
    course: "תכנות מונחה עצמים",
    blurb: "מטלת המשך: מחברים את המחלקות של המסעדה לחלון WPF, עם טבלת תפריט, הזמנה, כפתורים והוספת פריטים חדשים.",
    tags: ["המרת טיפוסים", "WPF", "DataGrid", "כימוס", "ירושה", "רב-צורתיות", "צבירה"],
    requires: "oop-restaurant",
    parts: [
      { title: "מכינים את החלון", href: "wpf-restaurant/part-1.html", min: 65, stages: 4 },
      { title: "ההזמנה בחלון", href: "wpf-restaurant/part-2.html", min: 55, stages: 4 }
    ]
  },
  {
    id: "oop-restaurant",
    title: "מסעדה: מערכת הזמנות במסוף",
    course: "תכנות מונחה עצמים",
    blurb: "מטלת סיכום: בונים מאפס אפליקציית מסוף שמנהלת הזמנות במסעדה, ומשתמשים בכל ארבעת העקרונות.",
    tags: ["כימוס", "ירושה", "רב-צורתיות", "צבירה", "List<T>", "Console"],
    parts: [
      { title: "פריטי התפריט", href: "oop-restaurant/part-1.html", min: 60, stages: 3 },
      { title: "ההזמנה והתוכנית", href: "oop-restaurant/part-2.html", min: 65, stages: 3 }
    ]
  }
];
