# Sistem Pengurusan R1/R2/R3 MIMOS Academy: Pelan Tindakan Bersepadu

Laporan Panel Pakar untuk Realisasi Sistem Tanpa Modal di Hostinger

## Ringkasan Eksekutif
Laporan ini mensintesis dapatan lapan panel pakar merentas pembangunan perisian, sains data, seni bina sistem, analisis kewangan, kemampanan, dan pengurusan projek. Matlamatnya adalah untuk merealisasikan sistem yang mengumpul data R1, R2, dan R3 daripada muat naik Excel, mengesan rantaian data Program A daripada funnel kepada quotation, PO, invois, dan pembayaran, serta menjana laporan dan dashboard untuk pengurusan. Sistem ini mesti beroperasi tanpa modal menggunakan domain sedia ada di Hostinger.

Semua disiplin bersetuju bahawa pendekatan paling berkesan ialah membina satu pangkalan data induk berpusatkan entiti Program/Peluang, dengan R1, R2, dan R3 sebagai pandangan atau output, bukan fail berasingan. Fasa pertama harus dimulakan dengan enjin import fail Excel yang idempotent dan pengesanan perubahan melalui hash baris, sebelum beralih kepada input terus oleh PIC.

Nilai kewangan paling besar terletak pada pengurangan kebocoran tunai: mengaitkan invois dengan kos, menonjolkan invois belum dibayar, dan mencegah duplikasi rekod. Sistem ini juga perlu menyediakan kawalan akses berasaskan peranan dan jejak audit sejak awal kerana data kewangan adalah sensitif.

Cadangan pelan tindakan dibahagikan kepada fasa persediaan, prototaip import, dashboard, dan penggunaan penuh, dengan petunjuk kejayaan yang boleh diukur.

## Asas Bukti dan Skop Data
Panel meneliti pelbagai fail Excel yang menjadi sumber R1/R2/R3: R1 MIMOS_Academy_INCOME_STATEMENT.xlsx, R2 Overall Report 2026.xlsx, R3 Group 2026 Funnel Tracker.xlsx, Quotation Tracker, invoice_2026.xlsx, cost_of_sales_2026.xlsx, office_funnel_2026-08-19.xlsx, sales_report_2026-08-19.xlsx, dan User Profiles Mapping.xlsx. Setiap fail mempunyai struktur, status, dan tahap kebersihan yang berbeza.

Data menunjukkan banyak ketidakselarasan: nombor quotation berbeza antara MSSB/QT/TRA dan MASB/QT/TRA, nama klien seperti MIMOS Berhad dan MIMOS Services Sdn Bhd digunakan secara campur, dan status bayaran bercanggah seperti MINDEF dicatat PAID dalam R1 tetapi UNPAID dalam invoice_2026. R2 mengandungi ralat formula #REF! dan #DIV/0!.

Daripada perspektif sistem, volum data adalah kecil dan boleh dimuatkan dalam pangkalan data MySQL biasa di Hostinger. Analisis kewangan mendapati sekurang-kurangnya 45 baris funnel dalam R3, 23 baris kos jualan, dan nilai invois penuh sekitar RM397,454.22, tetapi sebahagian invois sekitar RM149,972.03 tidak dipadankan dengan fail kos.

Oleh itu, sistem tidak boleh terus memproses fail mentah tanpa pembersihan dan pemetaan. Asas bukti ini menjadi justifikasi untuk membina kamus data dan peraturan padanan sebelum pembinaan sistem.

- Fail sumber utama: R1 Income Statement, R2 Overall Report, R3 Funnel Tracker, Quotation Tracker, invoice_2026, cost_of_sales_2026, office_funnel, sales_report, User Profiles Mapping.
- Ketidakselarasan kritikal: prefix quotation berbeza, nama klien tidak seragam, status bayaran bercanggah, ralat formula dalam R2.

## Sumbangan Disiplin: Pembangunan Perisian
Software Developer (Expert Opinion) menekankan penggunaan PHP dan MySQL pada Hostinger shared hosting sebagai pilihan paling realistik tanpa modal, kerana ia menyokong perpustakaan PhpSpreadsheet untuk membaca fail Excel. Beliau mencadangkan entiti pusat Program/Opportunity yang menghubungkan quotation, PO, invois, dan pembayaran, serta pembinaan berperingkat: upload, semakan, input terus, dan automasi.

Software Developer (First Principles) memecahkan sistem kepada empat blok asas: data mentah, pembersihan dan padanan, pangkalan data, dan paparan/eksport. Beliau mencadangkan jadual dokumen untuk merantai Quotation→PO→Invoice, jadual golden record untuk klien, jadual training_sessions untuk R2, dan pengesanan baris baru melalui hash sumber. Untuk bukan pembangun, dia menawarkan dua laluan MVP: Hostinger + WordPress + plugin atau Google Sheets + Apps Script + Looker Studio.

Kedua-dua pakar pembangunan perisian bersetuju bahawa dashboard dan eksport mesti dijana daripada pangkalan data tersimpan, bukan daripada fail asal, dan bahawa penjejakan perubahan adalah lebih penting daripada automasi penuh pada peringkat awal. Mereka juga menegaskan keperluan peranan pengguna dan audit trail.

Trade-off yang dikenal pasti termasuk parser rigid terhadap format semasa, kos pembinaan model dinormalisasi, dan pemilihan antara custom PHP atau alat low-code. Cadangan bercenderung kepada memulakan dengan pemetaan lajur tetap untuk 5–7 fail utama, kemudian menambah pemetaan dinamik selepas stabil.

## Sumbangan Disiplin: Sains Data
Data Scientist (First Principles) memodelkan sistem sebagai event log, bukan jadual laporan siap. Setiap dokumen atau tindakan adalah peristiwa: Lead_daftar, Quotation_dikeluarkan, PO_diterima, Invoice_dijana, Bayaran_diterima, Latihan_selesai, Peserta_direkodkan. Ini membolehkan sistem mengesan rantaian dan memaparkan R1/R2/R3 secara automatik.

Beliau mencadangkan kunci padanan berlapis: ID unik dalaman, nombor dokumen dinormalisasi, dan padanan fuzzy nama syarikat + tarikh + tajuk. Proses muat naik mesti idempotent dengan hash baris dan jadual audit, supaya baris yang sama diabaikan dan perubahan disimpan sebagai versi baharu.

Data Scientist (Systems Thinking) menekankan bahawa R1, R2, R3 adalah output, bukan struktur simpanan. Beliau mengesyorkan model data entiti: Program, Quotation, PO, Invoice, Payment, Participant. Setiap rekod perlu ID dalaman dan kunci padanan heuristik. Beliau juga menuntut penetapan source of truth untuk setiap medan dan gelung maklum balas automatik untuk mengubah tingkah laku pengguna.

Kedua-dua dapatan sains data menyokong normalisasi R2 kepada satu baris per program/peserta, pengiraan KPI dinamik dan bukannya formula dalam sel, serta penghijrahan berfasa dengan R1/R3 dahulu, R2 kemudian kerana kerumitan R2.

## Sumbangan Disiplin: Seni Bina Sistem
Systems Architect (Systems Thinking) berhujah bahawa R1, R2, R3 adalah tiga pandangan proses yang sama, bukan tiga sistem berasingan. Struktur menentukan tingkah laku: jika tiga fail kekal berasingan, percanggahan data tidak dapat dielakkan. Beliau mengesyorkan model kanonik berpusatkan engagement dan training_event.

Beliau menekankan leverage tertinggi ialah kunci pemadanan entiti. Tanpa ID program stabil, rantaian funnel → quotation → PO → invoice → pembayaran tidak dapat dikesan. Contoh ketidakstabilan termasuk dua siri nombor quotation MSSB vs MASB dan nama pelanggan yang berbeza ejaan.

Beliau juga menekankan log peristiwa lebih penting daripada snapshot spreadsheet, kerana ia membolehkan pengesanan perubahan dan audit. Muat naik mesti idempotent dengan normalisasi tarikh, nombor, dan trim ruang sebelum hash. Status perlu dikawal melalui perbendaharaan kata terkawal dan pemetaan nilai legasi.

Dari segi seni bina, beliau mengesyorkan monolit modular ringkas pada Hostinger, bukan microservices. Gunakan PHP/MySQL, elakkan background job berat, dan lakukan pemprosesan Excel pada masa muat naik. Notifikasi masa nyata boleh ditunda; gunakan pencetus semasa log masuk atau butang 'semak sekarang' sebagai penyelesaian pertama.

## Sumbangan Disiplin: Analisis Kewangan
Financial Analyst (Scenario Planning) menilai melalui tiga senario S1 manual, S2 sistem Fasa 1 upload dan detect chain, S3 sistem penuh. Beliau mendapati laporan untung 100% adalah ilusi kerana cost_of_sales_2026 menunjukkan semua kos sifar; jika kos sebenar 20%-40%, untung subset RM247,482.19 tidak boleh dianggap penuh.

Beliau menonjolkan kebocoran tunai utama: enam invois berjumlah ±RM149,972.03 tidak hadir dalam fail kos, sehingga 37.7% nilai invois tidak dipadankan. Rantaian secured→invoiced→collected perlu dipantau sebagai KPI; terdapat jurang ±RM434,005 antara nilai secured R3 dan jumlah invois, dan UNPAID invois ±RM130,739.63.

Status bayaran bercanggah antara R1 dan invoice_2026 (contoh MINDEF) menyebabkan laporan susulan hutang tidak boleh dipercayai. Beliau juga menemui risiko duplikasi invois sehingga RM26,800 bagi program yang sama dengan nilai berbeza. Oleh itu sistem mesti menyimpan timestamp, updated by, dan bukti pembayaran sebelum status berubah.

Untuk sistem tanpa modal, beliau mengesyorkan fokus kepada pembocoran tunai terbesar dahulu: penambahbaikan susulan 30% daripada UNPAID RM130.7k memberi ±RM39.2k tunai, dan pencegahan satu duplikasi RM26.8k adalah penjimatan langsung. Fasa 1 sebaiknya meliputi upload, padanan invois/kos/status, flag duplikasi, kira overdue, dan eksport R1/R2/R3 yang boleh diaudit.

## Sumbangan Disiplin: Kemampanan dan Reka Bentuk
Sustainability Advisor (Design Thinking) menggunakan Empathise→Define→Ideate→Prototype→Test dan mentafsir kemampanan sebagai kebolehgunaan jangka panjang, integriti data, kos penyelenggaraan rendah, dan adopsi pengguna. Beliau mendapati masalah akar ialah ketiadaan master program/opportunity ID; tanpa ID, padanan berdasarkan nama dan tarikh rapuh.

Data-quality debt semasa akan memecahkan automasi. Contohnya R2 mengandungi #REF! dan #DIV/0!, R1 baris 4 akaun MIMOS tetapi invoice_2026 akaun MB, dan format tarikh bercampur. Beliau mencadangkan soft warnings + gradual cleaning, bermula dengan satu fail.

Dari sudut adopsi, risiko kemampanan sebenar bukan teknologi tetapi pengguna. Brief menyatakan update terus R1/R2/R3 jarang berlaku; PIC lebih suka WhatsApp/emel. Sistem perlu mesra mudah alih, low-click, dan menghantar peringatan untuk bersaing dengan WhatsApp.

Beliau juga menekankan keselamatan: User Profiles mempunyai kata laluan lalai masb.12345, dan data kewangan sensitif. MVP mesti ada kawalan akses berasaskan peranan. Untuk alat, beliau menyebut custom PHP/MySQL, NocoDB/Budibase/Appsmith self-hosted, atau Google Sheets, pilihan bergantung keupayaan Hostinger dan siapa yang akan menyelenggara selepas pilot.

## Sumbangan Disiplin: Pengurusan Projek
Project Manager (Expert Opinion) mengingatkan bahawa keputusan pertama ialah mengesahkan sama ada yang ada adalah domain sahaja atau hosting + pangkalan data. Jika hanya domain, sistem tidak dapat berjalan; jika Hostinger shared hosting, ia mencukupi. Beliau juga menekankan pembinaan Data Dictionary dan peraturan padanan sebelum menyentuh sistem, kerana ini langkah paling penting untuk mengelak sampah masuk sampah keluar.

Beliau mencadangkan fasa projek Import→Dashboard→Export→Direct Entry, dan rantai data berdasarkan 5 status perniagaan: funnel, quotation, PO, invoice, payment. Model linear tidak sentiasa tepat, jadi sistem perlu benarkan langkah dilangkau tetapi menanda sebagai data tak lengkap.

Beliau menasihatkan supaya jangan jadikan auto-format penuh R2 sebagai syarat fasa pertama; keluarkan R2 sebagai jadual data ringkas dahulu. Alat low-code percuma seperti WordPress + plugin percuma atau Google Sheets sebagai backend adalah laluan realistik tanpa modal, dengan sedikit bantuan teknikal untuk skrip padanan.

Kawalan akses tiga peranan sahaja (Admin, PIC/Team, Viewer) cukup untuk fasa awal. Beliau mengesyorkan parallel run 2–4 minggu sebelum ganti proses manual, dan menetapkan KPI kejayaan: masa admin menyusun laporan, bilangan follow-up terlepas, dan bilangan rekod pending dikesan.

## Titik Perselisihan Utama
Walaupun konsensus luas tentang model data berpusat dan import-first, terdapat perselisihan tentang pilihan teknologi. Software Developer (Expert Opinion) cenderung kepada PHP+MySQL custom, manakala Project Manager (Expert Opinion) dan Software Developer (First Principles) menawarkan WordPress + plugin atau Google Sheets + Apps Script sebagai laluan lebih cepat untuk bukan pembangun. Sustainability Advisor menyebut NocoDB/Budibase/Appsmith sebagai kemungkinan tetapi bergantung pada Hostinger.

Terdapat ketegangan antara mesin keadaan yang ketat dan fleksibel. Data Scientist (First Principles) dan Systems Architect mencadangkan state machine yang jelas dengan peralihan sah, manakala Project Manager dan Sustainability Advisor berpendapat perlu ada status override untuk kes luar biasa seperti program terus dapat PO tanpa quotation.

Masa pengenalan input terus juga menjadi titik pergeseran. Software Developer (Expert Opinion) menegaskan fasa upload dahulu untuk belajar struktur data dan membina kepercayaan, manakala sesetengah cadangan pengurusan projek mahu direct entry diperkenalkan selepas dashboard stabil, bukan terlalu awal.

Terdapat juga perselisihan tentang sejauh mana R2 perlu diintegrasikan segera. Financial Analyst dan Data Scientist mengesyorkan R2 kemudian kerana kerumitan format, tetapi Sustainability Advisor menekankan R2 perlu dihubungkan sebagai entiti latihan yang berasingan sejak reka bentuk untuk mengelak pengubahsuaian besar kemudian.

## Risiko dan Mitigasi
Risiko utama ialah kualiti data sedia ada. R2 mengandungi ralat formula, tarikh bercampur, dan nilai kosong. Tanpa validasi semasa muat naik, laporan automatik akan senyap-senyap salah. Mitigasi: wujudkan peraturan validasi lembut, simpan nilai asal dan nilai bersih, dan tandakan baris perlu semakan.

Risiko adopsi pengguna adalah tinggi kerana pasukan sudah biasa dengan WhatsApp dan emel. Mitigasi: mulakan dengan upload Excel yang sudah menjadi kebiasaan, sediakan dashboard 'perlu tindakan' yang memberi nilai segera, dan lakukan parallel run. Sustainability Advisor menekankan sistem mesti mesra mudah alih dan low-click.

Risiko keselamatan kerana data kewangan dan kenalan kerajaan. User Profiles mempunyai kata laluan lalai. Mitigasi: guna kata laluan hashed, HTTPS, peranan akses minima, audit trail, dan jangan simpan kata laluan teks biasa. Project Manager mengesyorkan tiga peranan awal.

Risiko padanan salah dan duplikasi boleh menaikkan hasil palsu. Mitigasi: gunakan kunci berlapis, skor keyakinan, exception queue untuk semakan manual, dan flag duplikat berdasarkan quotation+klien+tarikh+tajuk. Financial Analyst menegaskan sistem mesti memaksa pengguna memilih jenis hubungan (revision/split/cancellation/supplementary).

## Model Data Entiti dan Kamus Data
Teras sistem adalah satu entiti pusat Program/Peluang yang menjadi sumber kebenaran. Semua dokumen dan peristiwa merujuk kepada ID program ini. Entiti Training Event perlu berasingan kerana R2 mencatat semua latihan, termasuk yang tidak menjana pendapatan.

Jadual utama yang dicadangkan: companies, contacts, opportunities, documents (quotation, PO, invoice), payments, training_sessions, participant_counts, users, import_log, audit_log. Setiap rekod menyimpan source_file, uploaded_at, row_hash, dan ID unik dalaman.

Kamus data perlu menyeragamkan nama klien, akaun, status, dan prefix quotation. Gunakan controlled list yang boleh diurus oleh admin; simpan nilai asal sebagai raw_value. Project Manager mencadangkan 1–2 minggu untuk membina kamus ini sebelum pembinaan sistem.

Kunci padanan dilapis: ID dalaman sistem, nombor dokumen yang dinormalisasi, dan padanan fuzzy nama syarikat + tarikh + tajuk. Untuk rekod keyakinan rendah, masuk ke exception queue untuk pengesahan PIC. Data Scientist menekankan jangan buang rekod unmatched; simpan dan paparkan untuk tindakan.

- Jadual teras: companies, contacts, opportunities, documents, payments, training_sessions, participant_counts, users, import_log, audit_log.
- Setiap rekod perlu source_file, uploaded_at, row_hash, dan ID dalaman.

## Enjin Import dan Pengesanan Perubahan
Fasa pertama mesti berasaskan import Excel, bukan input manual. Sistem perlu menerima fail Excel, membaca helaian yang diketahui, membersihkan data, dan menyimpan ke pangkalan data. Parser rigid untuk format semasa boleh dibina dahulu, kemudian tambah pemetaan dinamik.

Setiap baris sumber perlu di-hash selepas normalisasi (trim ruang, format tarikh, angka). Sistem menyimpan hash dan jika hash sama, abaikan; jika berbeza, simpan versi baharu dan log perubahan. Ini memenuhi keperluan 'admin upload fail, sistem kesan data baru masuk dan identify chain data'.

Proses import mesti idempotent: staging → semak hash → merge ke jadual utama. Simpan source_file, source_sheet, source_row, dan uploaded_at. Jika format fail berubah, log import menunjukkan ralat dan baris ditolak untuk semakan, bukan menggugurkan senyap.

Software Developer (Expert Opinion) mencadangkan mulakan dengan pemetaan lajur tetap untuk 5–7 fail utama: R1, R2, R3, Quotation Tracker, Invoice, Cost of Sales, dan office_funnel. Selepas stabil, tambah pemetaan dinamik apabila team menukar template.

## Mesin Keadaan dan Status Kanonik
Rantaian funnel→quotation→PO→invoice→payment perlu dimodelkan sebagai state machine. Peralihan sah contohnya: Lead→Quotation Dikeluarkan→PO Diterima→Invoice Dijana→Bayaran Diterima→Latihan Selesai. Setiap peringkat ada tarikh dan dokumen.

Status legasi perlu dipetakan kepada nilai kanonik. R3 guna Early engagement, Qualified lead, Proposal submitted, Negotiation, Verbal commitment, Contract signed/PO issued, Lost/No-go. R1 guna DONE, FOLLOW UP, PAID, UNPAID. office_funnel guna In Progress, Done, Pending. Sistem mesti menyimpan raw_value dan canonical_status.

State machine yang ketat mungkin kurang fleksibel, tetapi boleh ada status 'Override' dengan kebenaran admin dan catatan sebab. Project Manager menegaskan model linear tidak sentiasa tepat; sesetengah program terus mendapat PO tanpa quotation, jadi sistem perlu menandai langkah dilangkau sebagai data tak lengkap.

Status peringkat ini membolehkan sistem menonjolkan dokumen pending, program belum lengkap, dan payment follow-up secara automatik. Data Scientist (Systems Thinking) menyatakan tanpa status kanonik, sistem tidak boleh menjana 'dokumen pending' atau 'payment belum masuk' dengan tepat.

## Laporan R1/R2/R3 sebagai Pandangan Berasingan
R1 Income Statement perlu dijana daripada jadual dokumen dan pembayaran, bukan fail asal. Lajur kritikal: Invoice No, Payment Status, Due Date, Days Outstanding, Amount Collection. Formula Days Outstanding dan aging mesti dikira dinamik daripada tarikh peristiwa.

R2 Overall Report perlu dijana daripada training_events dan participant_counts. Ia mesti membezakan program berbayar, dalaman, FOC, dan belum dibil. Kiraan Bumiputera vs Non-Bumiputera dikira daripada data peserta, bukan matriks Excel. R2 boleh wujud tanpa invoice.

R3 Funnel Tracker perlu dijana daripada opportunities dan status funnel. Kira forecast, weighted forecast (Forecast × Probability), win/lost, dan conversion rate. Probability rasmi perlu dipetakan: Early engagement=10%, Qualified=30%, Proposal=50%, Negotiation=70%, Verbal=85%, Contract=100%, Lost=0% seperti disarankan Financial Analyst.

Eksport Excel boleh menggunakan PhpSpreadsheet. Fasa awal keluarkan jadual data ringkas dengan lajur kritikal; pemformatan penuh menyusul selepas pengesahan pengguna. Manager boleh export R1/R2/R3 bila-bila masa dari data tersimpan.

## Dashboard dan Amaran
Dashboard utama perlu memaparkan 8-10 KPI utama sahaja untuk elak kekeliruan. R1: jumlah hasil, dikutip, tertunggak, overdue, invois belum dibayar. R2: jumlah peserta, % Bumiputera, % non-Bumiputera, bayar vs percuma. R3: jumlah forecast, weighted forecast, win/lost, aging, peluang mengikut PIC.

Amaran perlu automatik berdasarkan status dan aging: invois lewat >30 hari, quotation pending >14 hari, latihan dalam tempoh 7 hari, data R2 belum lengkap. Software Developer (First Principles) menekankan hadkan KPI untuk fokus.

Mulakan dengan in-app dashboard 'Perubahan Hari Ini', 'Dokumen Pending', 'Bayaran Belum Masuk', 'Program Tidak Lengkap'. Ini sudah menjimatkan banyak kerja manual tanpa perlu integrasi WhatsApp/emel yang kompleks.

Gelung maklum balas adalah kunci adopsi. Systems Architect mencadangkan digest harian/mingguan dan paparan 'perlu tindakan' di dashboard utama. Notifikasi penuh boleh ditunda hingga fasa akhir kerana mungkin memerlukan perkhidmatan luar atau kelulusan.

## Kawalan Akses dan Audit
Sistem perlu peranan minima: Admin, PIC/Team, Viewer. Admin upload fail dan urus kamus data; PIC boleh kemas kini program masing-masing; Viewer (pengurusan) lihat dashboard/laporan sahaja. Data kewangan sensitif tidak boleh diubah oleh semua orang.

Gunakan User Profiles Mapping untuk seed pengguna, tetapi tukar serta-merta kata laluan lalai masb.12345. Terapkan password hashing, HTTPS, dan backup pangkalan data Hostinger yang diaktifkan. Jangan simpan kata laluan teks biasa.

Setiap perubahan mesti direkodkan sebagai audit trail: who, when, old value, new value, source. Ini penting untuk tadbir urus dan kepercayaan pengurusan. Software Developer (Expert Opinion) dan Project Manager menekankan audit trail sejak awal.

Apabila input terus diperkenalkan, guna dropdown, medan wajib, dan kekangan unik untuk nombor dokumen. Ini mengurangkan kesilapan input dan mengekalkan kualiti data.

## Pelan Tindakan Berfasa
Fasa 0 Persediaan (Minggu 1–2): Tentukan hosting dan pangkalan data, kumpul semua fail, bersihkan data, senaraikan medan dan kunci unik. Hasil: Dokumen Data Dictionary satu muka surat dan senarai sumber autoriti. Project Manager menekankan ini langkah terpenting sebelum sentuh sistem.

Fasa 1 Prototaip Import (Minggu 3–6): Bina mekanisme upload fail, parsing XLSX, pembersihan, hash baris, dan simpan ke staging. Padanan asas untuk R1/R3 menggunakan kunci dokumen dan nama. Sediakan exception queue untuk padanan rendah keyakinan. Software Developer (First Principles) mencadangkan fasa 5–7 untuk enjin import.

Fasa 2 Dashboard & Eksport Asas (Minggu 7–10): Bina paparan R1/R3 dan KPI utama, butang eksport Excel ringkas. Masukkan R2 sebagai jadual data ringkas. Jalankan parallel run 2–4 minggu dengan proses manual untuk sahkan output.

Fasa 3 Input Terus & Amaran (Minggu 11–14): Setelah data stabil, perkenalkan input terus oleh PIC dengan kawalan peranan dan validasi. Aktifkan amaran dalaman untuk overdue dan pending. Tambah pemformatan penuh R2 dan automasi reminder kemudian jika perlu.

Petunjuk kejayaan: masa admin menyusun R1/R2/R3 sebelum vs selepas, bilangan follow-up payment terlepas, bilangan rekod pending dikesan, dan ketepatan laporan. Financial Analyst menambah KPI kewangan: secured not invoiced, invoiced not collected, collected + reconciled.

- Fasa 0: Persediaan dan kamus data (Minggu 1–2).
- Fasa 1: Prototaip import dan padanan asas R1/R3 (Minggu 3–6).
- Fasa 2: Dashboard, eksport asas, parallel run (Minggu 7–10).
- Fasa 3: Input terus, amaran, pemformatan penuh (Minggu 11–14).

## Penutup dan Langkah Seterusnya
Sistem ini bukan sekadar tempat simpan Excel, tetapi platform aliran data yang menghubungkan funnel, jualan, dan latihan. Kejayaan bergantung pada permulaan kecil, pengesahan dengan satu rantai data, dan peralihan beransur-ansur dari upload manual ke input terus.

Pihak pengurusan perlu membuat keputusan tadbir urus: sumber autoriti setiap medan, pemetaan status kanonik, dan probability rasmi. Ini perlu dilakukan oleh PIC dan pengurusan sebelum pembinaan.

Langkah seterusnya: sahkan Hostinger hosting dan MySQL, lantik seorang pentadbir sistem dalaman, dan mulakan Fasa 0 dalam minggu ini. Sediakan ruang untuk maklum balas pengguna dan jangan tergesa-gesa menggantikan proses manual sepenuhnya.

Dengan konsensus panel ini, MIMOS Academy boleh merealisasikan sistem tanpa modal dengan risiko terurus, memberikan pengurusan dashboard tepat masa dan pasukan alat yang mengurangkan kerja manual.