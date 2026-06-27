export const legalConfig = {
  companyName: "BuatCuan",
  // Nama badan hukum resmi, dipakai di blok Kontak & Pengaduan Konsumen (wajib Permendag 31/2023).
  legalEntityName: "PT AKADEMI BUATCUAN INDONESIA",
  companyEmail: "legal@buatcuan.com",
  // TODO(owner): alamat resmi badan hukum belum tersedia — JANGAN tayang sebelum diisi data asli.
  companyAddress: "[ISI SEBELUM TAYANG: alamat resmi PT AKADEMI BUATCUAN INDONESIA]",
  // TODO(owner): nomor WhatsApp CS resmi belum tersedia — JANGAN tayang sebelum diisi data asli.
  // Format E.164 tanpa "+", contoh "6281234567890", supaya bisa langsung dipakai di link wa.me/.
  supportWhatsApp: "[ISI SEBELUM TAYANG: nomor WA CS]",
  domainName: "buatcuan.com",
  supportEmail: "support@buatcuan.com",
  effectiveDate: "6 Mei 2026",
};

export type LegalDocId = "terms" | "privacy" | "cookies" | "disclaimer" | "refund" | "acceptable-use" | "affiliate";

export type LegalSection = {
  id: string;
  title: string;
  body: string[];
};

export type LegalDoc = {
  id: LegalDocId;
  path: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const c = legalConfig;

export const legalDocs: Record<LegalDocId, LegalDoc> = {
  terms: {
    id: "terms",
    path: "/terms",
    title: "Terms & Conditions",
    description: `Ketentuan penggunaan ${c.companyName}, termasuk akun, membership, konten, pembayaran, dan batas tanggung jawab platform.`,
    lastUpdated: c.effectiveDate,
    sections: [
      {
        id: "agreement",
        title: "Persetujuan Penggunaan",
        body: [
          `Dengan membuat akun, membeli membership, atau menggunakan layanan ${c.companyName}, Anda menyetujui Terms & Conditions ini dan kebijakan terkait yang ditautkan pada halaman ini.`,
          `Jika Anda menggunakan platform atas nama bisnis atau organisasi, Anda menyatakan memiliki wewenang untuk menyetujui ketentuan ini atas nama pihak tersebut.`,
        ],
      },
      {
        id: "account",
        title: "Akun dan Keamanan",
        body: [
          "Anda bertanggung jawab menjaga kerahasiaan kredensial login dan seluruh aktivitas yang terjadi melalui akun Anda.",
          "Nomor WhatsApp digunakan sebagai identitas utama akun. Perubahan data utama dapat dibatasi untuk menjaga keamanan dan integritas histori transaksi.",
          "Segera hubungi support jika Anda mencurigai akses tidak sah, penyalahgunaan akun, atau masalah keamanan lain.",
        ],
      },
      {
        id: "subscription",
        title: "Membership, Pembayaran, dan Akses",
        body: [
          "Akses materi, tools, komunitas, atau fitur premium dapat bergantung pada status membership aktif dan paket yang dipilih.",
          "Harga, durasi, benefit, dan metode pembayaran dapat berubah dari waktu ke waktu. Perubahan tidak berlaku surut untuk transaksi yang sudah selesai kecuali dinyatakan lain.",
          "Kami dapat menolak, menahan, atau membatalkan akses apabila pembayaran bermasalah, terjadi indikasi fraud, atau akun melanggar kebijakan penggunaan.",
        ],
      },
      {
        id: "content",
        title: "Konten, Tools, dan AI-Generated Output",
        body: [
          "Materi, template, script, ide konten, footage, atau output berbasis AI disediakan sebagai bantuan edukasi dan produktivitas, bukan jaminan hasil finansial.",
          "Anda bertanggung jawab meninjau, menyesuaikan, dan memastikan konten yang dipublikasikan mematuhi hukum, kebijakan platform pihak ketiga, dan hak kekayaan intelektual.",
        ],
      },
      {
        id: "prohibited",
        title: "Aktivitas Terlarang",
        body: [
          "Anda tidak boleh menggunakan layanan untuk spam, penipuan, scraping tidak sah, pelanggaran hak cipta, penyebaran malware, manipulasi pembayaran, atau aktivitas yang merugikan pengguna lain.",
          "Ketentuan lebih rinci tersedia pada Acceptable Use Policy.",
        ],
      },
      {
        id: "termination",
        title: "Pembatasan dan Penghentian Akses",
        body: [
          "Kami dapat membatasi, menangguhkan, atau menghentikan akses akun jika terdapat pelanggaran kebijakan, risiko keamanan, permintaan hukum, atau penyalahgunaan layanan.",
          "Penghentian akses tidak otomatis menghapus kewajiban pembayaran, histori transaksi, atau hak kami untuk mempertahankan data yang diwajibkan hukum.",
        ],
      },
      {
        id: "liability",
        title: "Batas Tanggung Jawab",
        body: [
          `${c.companyName} tidak bertanggung jawab atas kehilangan keuntungan, gangguan bisnis, keputusan bisnis, performa kampanye, atau tindakan pihak ketiga yang berada di luar kontrol wajar kami.`,
          "Layanan disediakan berdasarkan ketersediaan yang wajar. Kami berupaya menjaga stabilitas platform, tetapi tidak menjamin layanan bebas gangguan setiap saat.",
        ],
      },
    ],
  },
  privacy: {
    id: "privacy",
    path: "/privacy",
    title: "Privacy Policy",
    description: `Cara ${c.companyName} mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi data pengguna.`,
    lastUpdated: c.effectiveDate,
    sections: [
      {
        id: "data-collected",
        title: "Data yang Kami Kumpulkan",
        body: [
          "Kami dapat mengumpulkan nama, nomor WhatsApp, kredensial terenkripsi, status membership, histori pembayaran, riwayat penggunaan fitur, data perangkat, alamat IP, dan preferensi komunikasi.",
          "Jika Anda menggunakan fitur affiliate, mentor, tools, atau pembayaran, kami juga dapat menyimpan data referral, transaksi, komisi, status invoice, dan catatan dukungan.",
        ],
      },
      {
        id: "use",
        title: "Penggunaan Data",
        body: [
          "Data digunakan untuk membuat dan mengamankan akun, memproses pembayaran, menyediakan materi dan tools, mengelola membership, mencegah penyalahgunaan, memberikan dukungan, dan meningkatkan layanan.",
          "Kami dapat menggunakan data agregat atau teranonimisasi untuk analitik produk, pelaporan internal, dan pengambilan keputusan bisnis.",
        ],
      },
      {
        id: "gdpr",
        title: "Hak Privasi dan Penghapusan Data",
        body: [
          "Kami mendukung prinsip GDPR-style seperti akses data, koreksi data, portabilitas, pembatasan pemrosesan, dan permintaan penghapusan sepanjang tidak bertentangan dengan kewajiban hukum, keamanan, atau pembukuan.",
          `Permintaan akses, koreksi, atau penghapusan data dapat dikirim ke ${c.supportEmail}. Kami dapat meminta verifikasi identitas sebelum memproses permintaan.`,
        ],
      },
      {
        id: "sharing",
        title: "Layanan Pihak Ketiga",
        body: [
          "Kami dapat menggunakan penyedia pembayaran, hosting, penyimpanan file, analitik, email, customer support, atau layanan keamanan untuk menjalankan platform.",
          "Pihak ketiga hanya menerima data yang diperlukan untuk menyediakan layanan terkait dan diharapkan menjaga keamanan data sesuai standar yang wajar.",
        ],
      },
      {
        id: "retention",
        title: "Retensi dan Keamanan",
        body: [
          "Data akun disimpan selama akun aktif atau selama diperlukan untuk menyediakan layanan, memenuhi kewajiban hukum, menyelesaikan sengketa, dan mencegah fraud.",
          "Kami menerapkan kontrol teknis dan organisasi seperti hashing password, pembatasan akses internal, logging, dan praktik penyimpanan yang sesuai untuk mengurangi risiko akses tidak sah.",
        ],
      },
      {
        id: "children",
        title: "Pengguna di Bawah Umur",
        body: [
          "Layanan tidak ditujukan untuk anak-anak yang belum memiliki kapasitas hukum untuk membuat kontrak digital. Jika Anda mewakili orang tua atau wali dan menemukan data anak tersimpan, hubungi kami.",
        ],
      },
    ],
  },
  cookies: {
    id: "cookies",
    path: "/cookies",
    title: "Cookie Policy",
    description: `Penjelasan penggunaan cookies, local storage, analytics, dan pilihan pengguna di ${c.companyName}.`,
    lastUpdated: c.effectiveDate,
    sections: [
      {
        id: "what",
        title: "Apa Itu Cookies",
        body: [
          "Cookies dan teknologi serupa adalah data kecil yang disimpan di browser atau perangkat untuk membantu website mengenali sesi, preferensi, dan aktivitas penggunaan.",
        ],
      },
      {
        id: "types",
        title: "Jenis Cookies yang Digunakan",
        body: [
          "Essential cookies digunakan untuk login, keamanan, preferensi tema, dan fungsi utama platform.",
          "Analytics cookies dapat digunakan untuk memahami performa halaman, error, sumber trafik, dan fitur yang sering dipakai.",
          "Marketing cookies hanya digunakan jika kami menjalankan kampanye, retargeting, atau pengukuran iklan dengan partner pihak ketiga.",
        ],
      },
      {
        id: "local-storage",
        title: "Local Storage",
        body: [
          "Aplikasi dapat menyimpan token sesi, preferensi tampilan, dan status UI di local storage browser agar pengalaman pengguna tetap konsisten.",
          "Menghapus data browser dapat membuat Anda logout atau mengatur ulang preferensi tampilan.",
        ],
      },
      {
        id: "control",
        title: "Mengelola Cookies",
        body: [
          "Anda dapat membatasi atau menghapus cookies melalui pengaturan browser. Namun, beberapa fitur seperti login atau keamanan sesi dapat berhenti bekerja jika cookies penting diblokir.",
        ],
      },
    ],
  },
  disclaimer: {
    id: "disclaimer",
    path: "/disclaimer",
    title: "Disclaimer",
    description: `Batasan klaim edukasi, AI-generated content, hasil bisnis, dan tanggung jawab pengguna ${c.companyName}.`,
    lastUpdated: c.effectiveDate,
    sections: [
      {
        id: "education",
        title: "Informasi Edukasi",
        body: [
          "Seluruh materi, tools, template, ide konten, dan rekomendasi disediakan untuk tujuan edukasi dan produktivitas.",
          "Informasi di platform bukan nasihat hukum, pajak, finansial, investasi, atau jaminan performa bisnis.",
        ],
      },
      {
        id: "results",
        title: "Tidak Ada Jaminan Hasil",
        body: [
          "Hasil pengguna dapat berbeda bergantung pada niche, kualitas eksekusi, waktu, platform distribusi, budget, market, dan faktor lain di luar kendali kami.",
          "Testimoni, studi kasus, atau contoh pendapatan tidak boleh dianggap sebagai hasil yang pasti akan Anda capai.",
        ],
      },
      {
        id: "ai",
        title: "AI-Generated Content",
        body: [
          "Output yang dibuat atau dibantu AI dapat mengandung ketidakakuratan, bias, duplikasi, atau klaim yang perlu diverifikasi.",
          "Anda wajib meninjau dan menyesuaikan output sebelum digunakan secara publik, komersial, atau untuk komunikasi dengan pelanggan.",
        ],
      },
      {
        id: "third-party",
        title: "Platform dan Layanan Pihak Ketiga",
        body: [
          "Kami tidak mengontrol kebijakan, algoritma, biaya, atau tindakan platform pihak ketiga seperti marketplace, social media, payment gateway, hosting, atau penyedia analytics.",
        ],
      },
    ],
  },
  refund: {
    id: "refund",
    path: "/refund-policy",
    title: "Refund Policy",
    description: `Ketentuan refund, pembatalan, dispute pembayaran, dan pengecualian refund ${c.companyName}.`,
    lastUpdated: c.effectiveDate,
    sections: [
      {
        id: "eligibility",
        title: "Kelayakan Refund",
        body: [
          "Refund dapat dipertimbangkan jika terjadi pembayaran ganda, akses tidak aktif karena kesalahan sistem, atau transaksi belum digunakan dan memenuhi syarat waktu yang berlaku.",
          "Permintaan refund harus menyertakan identitas akun, bukti pembayaran, waktu transaksi, metode pembayaran, dan alasan permintaan.",
        ],
      },
      {
        id: "non-refundable",
        title: "Kondisi Tidak Dapat Refund",
        body: [
          "Pembayaran umumnya tidak dapat direfund jika membership sudah aktif dan konten premium, tools, video, PDF, komunitas, atau benefit digital telah diakses secara substansial.",
          "Refund juga dapat ditolak untuk akun yang melanggar Acceptable Use Policy, melakukan fraud, chargeback abuse, atau penyalahgunaan promosi.",
        ],
      },
      {
        id: "process",
        title: "Proses dan Waktu Peninjauan",
        body: [
          `Kirim permintaan ke ${c.supportEmail}. Kami akan meninjau permintaan secara wajar berdasarkan data transaksi dan status penggunaan layanan.`,
          "Jika refund disetujui, waktu dana kembali bergantung pada metode pembayaran, bank, payment gateway, dan prosedur pihak ketiga.",
        ],
      },
      {
        id: "cancellation",
        title: "Pembatalan Subscription",
        body: [
          "Jika tersedia subscription berulang, pembatalan menghentikan perpanjangan berikutnya tetapi tidak otomatis mengembalikan pembayaran periode berjalan kecuali diwajibkan hukum atau disetujui secara khusus.",
        ],
      },
      {
        id: "dispute",
        title: "Payment Dispute",
        body: [
          "Jika Anda membuka dispute melalui bank atau payment provider, akses akun dapat ditahan sementara sampai dispute selesai untuk mencegah fraud dan duplikasi kompensasi.",
        ],
      },
    ],
  },
  "acceptable-use": {
    id: "acceptable-use",
    path: "/acceptable-use",
    title: "Acceptable Use Policy",
    description: `Batas penggunaan yang diizinkan dan dilarang saat memakai ${c.companyName}.`,
    lastUpdated: c.effectiveDate,
    sections: [
      {
        id: "permitted",
        title: "Penggunaan yang Diizinkan",
        body: [
          "Anda dapat memakai layanan untuk belajar, membuat konten, mengelola ide campaign, menyimpan materi, menggunakan template, dan meningkatkan workflow bisnis secara legal dan etis.",
        ],
      },
      {
        id: "abuse",
        title: "Penyalahgunaan yang Dilarang",
        body: [
          "Dilarang menggunakan platform untuk spam, phishing, scam, malware, doxxing, pelecehan, ujaran kebencian, pornografi ilegal, pelanggaran hak cipta, atau manipulasi sistem pembayaran.",
          "Dilarang membagikan akses akun, menjual ulang materi tanpa izin, melakukan scraping masif, mengakali rate limit, atau mencoba mengakses data pengguna lain.",
        ],
      },
      {
        id: "ai-content",
        title: "Penggunaan AI dan Konten Otomatis",
        body: [
          "Konten yang dibuat dengan bantuan AI harus ditinjau manusia sebelum dipublikasikan, terutama jika menyangkut klaim kesehatan, keuangan, hukum, identitas, atau promosi produk.",
          "Anda tidak boleh menggunakan output AI untuk meniru identitas orang lain, membuat klaim palsu, atau memanipulasi audiens secara menyesatkan.",
        ],
      },
      {
        id: "enforcement",
        title: "Penegakan Kebijakan",
        body: [
          "Kami dapat menghapus konten, menolak upload, membatasi fitur, menangguhkan akun, atau melaporkan aktivitas kepada pihak berwenang jika diperlukan untuk melindungi platform dan pengguna.",
        ],
      },
    ],
  },
  affiliate: {
    id: "affiliate",
    path: "/affiliate-rules",
    title: "Aturan Affiliate & Komisi",
    description: `Cara kerja komisi mentor/affiliate ${c.companyName}: sumber komisi, besaran, dan batasan single-level.`,
    lastUpdated: c.effectiveDate,
    sections: [
      {
        id: "single-level",
        title: "Program Single-Level — Bukan MLM",
        body: [
          "Program affiliate/mentor BuatCuan bersifat single-level: Anda hanya mendapat komisi dari member yang Anda referensikan secara langsung, bukan dari jaringan rekrutmen berjenjang (downline/upline).",
          "Tidak ada komisi yang dihasilkan dari merekrut mentor atau affiliate baru. Pendapatan murni berasal dari transaksi nyata member yang Anda bantu, sesuai bagian 'Sumber Komisi' di bawah.",
        ],
      },
      {
        id: "source",
        title: "Sumber Komisi",
        body: [
          "Komisi hanya dihitung dari penjualan atau perpanjangan membership PRO yang nyata terjadi — bukan dari aktivitas merekrut, bukan dari biaya pendaftaran, dan bukan dari klik atau kunjungan link semata.",
          "Link referral yang Anda bagikan adalah link komisi: jika seseorang mendaftar lalu membeli atau memperpanjang paket PRO melalui link tersebut, sistem mencatat transaksi itu sebagai dasar komisi Anda.",
        ],
      },
      {
        id: "amount",
        title: "Besaran dan Sifat Komisi",
        body: [
          "Besaran komisi mengikuti ketentuan paket yang berlaku saat transaksi terjadi dan dapat berubah dari waktu ke waktu untuk member/paket berikutnya.",
          "Komisi bersifat berpotensi (potential), bukan jaminan. Tidak ada janji nominal, jadwal cair, atau hasil pasti — besar komisi bergantung pada jumlah member aktif yang nyata melakukan transaksi.",
        ],
      },
      {
        id: "payout",
        title: "Pencairan Komisi",
        body: [
          "Komisi yang tercatat dapat ditarik (withdraw) sesuai saldo dan ketentuan minimum penarikan yang berlaku di akun Anda.",
          "Komisi dari transaksi yang dibatalkan, direfund, atau terbukti fraud akan dibatalkan/disesuaikan dan tidak dapat dicairkan.",
        ],
      },
      {
        id: "prohibited",
        title: "Larangan",
        body: [
          "Dilarang menjanjikan hasil pasti, klaim 'cepat kaya', atau klaim menyesatkan lain saat mempromosikan link referral Anda kepada calon member.",
          "Dilarang membuat akun palsu, transaksi fiktif, atau cara lain untuk memanipulasi penghitungan komisi.",
        ],
      },
    ],
  },
};

export const relatedLegalLinks = [
  { label: "Terms & Conditions", path: "/terms" },
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Cookie Policy", path: "/cookies" },
  { label: "Disclaimer", path: "/disclaimer" },
  { label: "Refund Policy", path: "/refund-policy" },
  { label: "Acceptable Use Policy", path: "/acceptable-use" },
  { label: "Aturan Affiliate & Komisi", path: "/affiliate-rules" },
  { label: "FAQ", path: "/faq" },
  { label: "Contact", path: "/contact" },
];

export type FaqCategory = "General" | "Account" | "Billing" | "Privacy" | "Technical" | "Refund";

export type FaqItem = {
  category: FaqCategory;
  question: string;
  answer: string;
};

export const faqCategories: FaqCategory[] = ["General", "Account", "Billing", "Privacy", "Technical", "Refund"];

export const faqItems: FaqItem[] = [
  { category: "General", question: "Apa itu BuatCuan?", answer: "BuatCuan adalah platform pembelajaran, tools, dan resource digital untuk membantu member membuat konten, memahami workflow monetisasi, dan mengelola aktivitas online secara lebih terstruktur." },
  { category: "General", question: "Apakah BuatCuan menjamin penghasilan?", answer: "Tidak. Materi dan tools bersifat edukasi dan produktivitas. Hasil setiap pengguna dapat berbeda karena bergantung pada eksekusi, niche, platform, market, dan faktor lain." },
  { category: "General", question: "Apakah konten boleh dipakai untuk bisnis?", answer: "Ya, selama penggunaan mematuhi hukum, hak kekayaan intelektual, kebijakan platform pihak ketiga, dan ketentuan penggunaan BuatCuan." },
  { category: "General", question: "Apakah tersedia fitur AI-generated content?", answer: "Beberapa tools dapat berisi ide, template, atau output yang dibantu AI. Pengguna wajib meninjau dan menyesuaikan output sebelum dipublikasikan." },
  { category: "General", question: "Bagaimana cara menghubungi support?", answer: `Anda dapat menghubungi support melalui ${c.supportEmail} dengan menyertakan nomor WhatsApp akun, detail kendala, dan bukti transaksi jika terkait pembayaran.` },
  { category: "Account", question: "Bagaimana data akun disimpan?", answer: "Data akun disimpan di database platform dengan kontrol akses terbatas. Password disimpan dalam bentuk hash, bukan teks asli." },
  { category: "Account", question: "Apakah nomor WhatsApp bisa diganti?", answer: "Nomor WhatsApp menjadi data utama akun dan tidak dapat diedit dari halaman pengaturan untuk menjaga integritas akun, histori transaksi, dan keamanan." },
  { category: "Account", question: "Bagaimana cara mengganti nama akun?", answer: "Nama dapat diganti dari halaman pengaturan akun. Setelah disimpan, nama dikunci selama 90 hari untuk meminimalkan penyalahgunaan identitas." },
  { category: "Account", question: "Bagaimana cara menghapus akun?", answer: `Kirim permintaan penghapusan data ke ${c.supportEmail}. Kami dapat meminta verifikasi identitas dan akan mempertahankan data tertentu jika diperlukan untuk kewajiban hukum atau pembukuan.` },
  { category: "Account", question: "Apa yang harus dilakukan jika akun diakses orang lain?", answer: "Segera ubah password dan hubungi support. Kami dapat membantu meninjau aktivitas akun dan mengambil tindakan keamanan tambahan jika diperlukan." },
  { category: "Billing", question: "Metode pembayaran apa yang didukung?", answer: "Metode pembayaran dapat bervariasi sesuai integrasi aktif, misalnya transfer, virtual account, e-wallet, QR, atau payment gateway pihak ketiga." },
  { category: "Billing", question: "Mengapa pembayaran saya pending?", answer: "Status pending dapat terjadi karena konfirmasi payment gateway belum selesai, pembayaran belum masuk, atau verifikasi membutuhkan waktu tambahan." },
  { category: "Billing", question: "Apakah subscription bisa dibatalkan?", answer: "Jika tersedia subscription berulang, pembatalan menghentikan perpanjangan berikutnya. Akses periode berjalan mengikuti ketentuan paket dan refund policy." },
  { category: "Billing", question: "Apa yang terjadi jika ada payment dispute?", answer: "Akses akun dapat ditahan sementara selama dispute atau chargeback ditinjau untuk mencegah fraud dan duplikasi kompensasi." },
  { category: "Billing", question: "Apakah invoice atau bukti bayar tersedia?", answer: "Histori pembayaran dapat dilihat dari akun. Untuk kebutuhan bukti tambahan, hubungi support dengan detail transaksi." },
  { category: "Privacy", question: "Data apa saja yang dikumpulkan?", answer: "Kami dapat mengumpulkan nama, nomor WhatsApp, histori transaksi, status membership, data penggunaan fitur, alamat IP, perangkat, dan data yang diperlukan untuk support." },
  { category: "Privacy", question: "Apakah data dijual ke pihak ketiga?", answer: "Kami tidak menjual data pribadi pengguna. Data dapat dibagikan ke penyedia layanan yang diperlukan seperti pembayaran, hosting, penyimpanan, analytics, atau support." },
  { category: "Privacy", question: "Bagaimana cara meminta penghapusan data?", answer: `Kirim permintaan ke ${c.supportEmail}. Permintaan akan diverifikasi dan diproses sepanjang tidak bertentangan dengan kewajiban hukum, keamanan, atau pembukuan.` },
  { category: "Privacy", question: "Apakah BuatCuan menggunakan cookies?", answer: "Ya. Cookies dan local storage digunakan untuk login, keamanan, preferensi tema, analitik, dan peningkatan pengalaman pengguna." },
  { category: "Privacy", question: "Apakah ada wording GDPR-style?", answer: "Ya. Privacy Policy menjelaskan hak akses, koreksi, portabilitas, pembatasan pemrosesan, dan penghapusan data sesuai prinsip GDPR-style." },
  { category: "Technical", question: "Kenapa saya tidak bisa login?", answer: "Pastikan nomor WhatsApp dan password benar. Jika sesi berakhir atau token invalid, logout lalu login kembali. Hubungi support jika tetap gagal." },
  { category: "Technical", question: "Apakah platform mobile friendly?", answer: "Ya. Antarmuka utama dibuat responsive untuk mobile dan desktop, termasuk halaman legal, FAQ, dan dashboard member." },
  { category: "Technical", question: "Kenapa video atau file tidak terbuka?", answer: "Masalah dapat terjadi karena koneksi, izin akses, storage provider, browser, atau status membership. Coba refresh dan pastikan akun aktif." },
  { category: "Technical", question: "Apakah dark mode didukung?", answer: "Ya. Halaman aplikasi, legal, dan FAQ dibuat kompatibel dengan dark mode dan preferensi tema pengguna." },
  { category: "Technical", question: "Bagaimana melaporkan bug?", answer: `Kirim laporan ke ${c.supportEmail} dengan langkah reproduksi, screenshot jika ada, jenis perangkat, browser, dan waktu kejadian.` },
  { category: "Refund", question: "Apakah saya bisa meminta refund?", answer: "Refund dapat dipertimbangkan untuk kondisi tertentu seperti pembayaran ganda atau akses tidak aktif karena kesalahan sistem. Detailnya ada di Refund Policy." },
  { category: "Refund", question: "Kapan refund tidak berlaku?", answer: "Refund umumnya tidak berlaku jika akses premium sudah digunakan secara substansial atau akun melanggar kebijakan penggunaan." },
  { category: "Refund", question: "Berapa lama proses refund?", answer: "Waktu peninjauan dan pengembalian dana bergantung pada detail kasus, metode pembayaran, bank, dan payment gateway." },
  { category: "Refund", question: "Apakah pembatalan subscription otomatis refund?", answer: "Tidak selalu. Pembatalan subscription menghentikan perpanjangan berikutnya, sedangkan periode berjalan mengikuti ketentuan refund yang berlaku." },
  { category: "Refund", question: "Bagaimana cara mengajukan refund?", answer: `Kirim email ke ${c.supportEmail} dengan nomor WhatsApp akun, bukti pembayaran, waktu transaksi, dan alasan permintaan refund.` },
];
