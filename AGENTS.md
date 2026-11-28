# Aturan Mutlak Pengerjaan SKIEESTORE

Dokumen ini adalah sumber aturan utama untuk setiap pekerjaan audit, perbaikan, pengembangan, dan perubahan kode di repository SKIEESTORE. Baca dokumen ini SEBELUM memeriksa atau mengedit kode pada setiap sesi kerja. Jika ada instruksi tugas yang bertentangan dengan aturan ini, berhenti dan minta klarifikasi; jangan diam-diam melanggar aturan.

## 11 Aturan Wajib

1. **DILARANG KERAS** membuat file CSS baru, tag `<style>` internal baru, atau komponen UI duplikat (seperti Header/Navbar/Widget versi baru).
2. **DILARANG** menimpa (override) bug dengan CSS baru sebelum menghapus kode lama yang menyebabkan konflik.
3. **WAJIB** audit repository dan cari akar masalah terlebih dahulu, lalu hapus kode/file lama yang rusak atau tidak terpakai jika memang terbukti menjadi sumber masalah. Jangan menghapus sesuatu hanya berdasarkan dugaan.
4. Seluruh halaman **WAJIB** memakai satu sumber komponen dan satu token warna global yang sudah ada di website utama (`skieestore.biz.id`).
5. **JANGAN** bekerja sembarangan atau mengabaikan perintah inti. Fokus tuntaskan masalah spesifik yang diminta; jangan membuat struktur baru yang berbelit-belit untuk masalah sederhana.
6. **BATASI PERUBAHAN** hanya pada perintah yang diminta. Jangan menyentuh, mengubah, atau merombak fitur/kode lain yang tidak diminta.
7. **JANGAN MERUSAK FITUR NORMAL.** Jangan mengubah logika Asisten AI (`SKIEESTORE AI`), sistem transaksi, atau fungsi backend kecuali diminta secara eksplisit.
8. **WAJIB RESPONSIF MOBILE & TANPA AUTO-ZOOM.** Semua halaman harus memakai standar `<meta name="viewport">` yang sama dengan Beranda dan tidak boleh memiliki elemen yang melebar melebihi `100vw`.
9. **JANGAN MENYISAKAN TEKS MENTAH ATAU TOMBOL SAMPAH.** Pastikan tidak ada karakter literal `\n` yang bocor ke tampilan dan jangan menambahkan tombol navigasi balik mubazir seperti "Kembali ke Beranda/Katalog".
10. **WAJIB LAPORKAN PERUBAHAN FILE.** Setelah selesai, sebutkan dengan jelas dan jujur setiap file yang diedit, dibuat, atau dihapus.
11. Aturan ini harus terus dijadikan pedoman pada setiap sesi pengerjaan SKIEESTORE. Jangan mengandalkan ingatan percakapan saja: baca kembali dokumen ini sebelum mulai bekerja.

## Prosedur Wajib Sebelum Mengedit

- Baca `AGENTS.md` terlebih dahulu pada setiap sesi kerja.
- Pastikan repository dan branch yang benar sebelum melakukan perubahan.
- Audit file terkait dan telusuri sumber masalah sampai ke akar penyebabnya.
- Identifikasi dampak perubahan dan fitur yang wajib dilindungi.
- Jangan mulai mengedit sebelum ruang lingkup perubahan jelas dan sesuai permintaan pengguna.
- Jika perubahan yang diminta berpotensi melanggar salah satu aturan di atas, berhenti dan jelaskan konflik tersebut terlebih dahulu.

## Prosedur Wajib Saat dan Setelah Mengedit

- Ubah sesedikit mungkin file dan baris yang diperlukan untuk menyelesaikan permintaan.
- Jangan membuat file, komponen, stylesheet, atau lapisan override baru yang dilarang.
- Pertahankan perilaku fitur yang tidak diminta untuk diubah.
- Periksa perubahan/diff untuk memastikan tidak ada perubahan sampingan.
- Jalankan pemeriksaan yang relevan jika tersedia. Jangan mengaku sudah menguji sesuatu yang tidak benar-benar dijalankan.
- Verifikasi hasil deployment sebelum menyatakan perubahan sudah tayang. Jangan mengaku deployment berhasil tanpa bukti.
- Laporkan file yang dibuat/diubah/dihapus, ringkasan perubahan, pemeriksaan yang benar-benar dilakukan, dan hal yang belum dapat diverifikasi.

## Batas Kejujuran

Jangan pernah mengklaim telah membaca aturan, mengaudit repository, menguji tampilan/mobile, menjaga fitur, atau memverifikasi deployment jika langkah tersebut belum benar-benar dilakukan. Jika akses atau alat tidak tersedia, nyatakan keterbatasannya dan jangan menebak.
