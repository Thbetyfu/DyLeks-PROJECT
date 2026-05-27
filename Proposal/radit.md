# Sistem deployment website

## Frontend dihost di public dengan Backend dihost di server lokal
Frontend website akan dihost pada server publik seperti vercel. Server publik ini hanya bertujuan untuk membuka website untuk pertama kali tanpa adanya interaksi tambahan antara client dan public server. Kemudian, website akan melakukan pengecekan jika pengguna terhubung pada jaringan lokal milik guru. Jika iya, maka data akan langsung dikirimkan pada Backend pada server lokal (yang sudah mempunya domain dan bersertifikat SSL agar dapat HTTPS). Jika tidak, maka data akan disimpan pada localstroage client hingga client terhubung pada jaringan lokal milik guru.

Agar website dapat digunakan pada beberapa sekolah dengan menjaga kerahasiaan data setiap sekolah. Maka backend harus dapat memisahkan database antara sekolah-sekolah yang menggunakan layanan DyLeks. Terdapat dua opsi pemisahan antar-sekolah, yakni:
1. Hard code IP lokal. IP lokal harus sama disetiap server sekolah. Dengan demikian, domain backend dapat mengarah ke IP address yang sama tanpa bentrokan antar-sekolah.
2. Menggunakan sub-domain di setiap sekolah

Sangat disarankan menggunakan opsi 1 karena tidak perlu koneksi internet seperti opsi 2