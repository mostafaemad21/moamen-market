# ماركت مؤمن — صفحة الـ NFC

صفحة واحدة بتفتح أول ما الموبايل يلمس الاستاند:

- 📞 اتصال · 💬 واتساب · 🗺️ الخريطة
- 💳 الدفع: فودافون كاش + إنستاباي (لينكات دفع مباشرة)
- 📍 العنوان والمواعيد

**الموقع:** <https://mostafaemad21.github.io/moamen-market/>

---

## تعديل البيانات

كل حاجة في ملف `index.html` جوه `<script>` عند `const CONFIG`:

```js
const CONFIG = {
  phone: "01111177487",
  whatsapp: "201111177486",
  maps: "https://maps.app.goo.gl/...",
  website: "https://mostafaemad21.github.io/moamen-market/",
  instapay: "https://ipn.eg/...",
  vodafone: "https://vf.eg/...",
  facebook: "", instagram: "", tiktok: "", reviews: ""
};
```

- السوشيال فاضية = مش بتظهر. أول ما تحط لينك، الأيقونة بتظهر لوحدها.
- المواعيد: من ٧ صباحًا لـ ١ بعد منتصف الليل (شيفت بيعدّي نص الليل).

## برمجة شريحة الـ NFC

1. نزّل **NFC Tools** من المتجر.
2. **Write** → **Add a record** → **URL / URI**.
3. اكتب: `https://mostafaemad21.github.io/moamen-market/`
4. **Write** وقرّب الموبايل من الشريحة.
