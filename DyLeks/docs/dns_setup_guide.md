# 📡 Panduan Penataan Wi-Fi Kelas & DNS Lokal (Zero-IP Captive Portal)

Dokumen ini memandu penginstalan dan penataan jaringan nirkabel lokal kelas luring untuk platform **DyLeks** di daerah 3T. Tujuannya adalah agar murid/orang tua cukup mengetik domain **`dyleks.id`** atau **`dyleks.local`** pada browser smartphone mereka untuk masuk ke aplikasi, tanpa perlu mengetik alamat IP server.

---

## 🏗️ 1. Desain Arsitektur Jaringan Kelas

```
                     [ Laptop Guru (Server Hub) ]
                     IP Statis: 192.168.1.100
                     FastAPI: Port 3002
                     Next.js: Port 3001
                               │
                               │ Wi-Fi Jaringan Lokal (Tanpa Internet)
                               ▼
                    [ Router Wi-Fi Kelas ]
            (Menyediakan DHCP & DNS Server Lokal)
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     [ Smartphone A ]   [ Smartphone B ]   [ Smartphone C ]
      Browser Klien      Browser Klien      Browser Klien
```

---

## ⚙️ 2. Langkah 1: Pengaturan IP Statis Laptop Guru

Agar router dan perangkat klien selalu mengarah ke laptop guru yang sama, laptop guru harus dikonfigurasi dengan alamat IP statis.

1. Hubungkan laptop ke Router Wi-Fi kelas.
2. Buka **Control Panel** -> **Network and Sharing Center** -> **Change adapter settings**.
3. Klik kanan pada adaptor Wi-Fi Anda, pilih **Properties**.
4. Klik ganda pada **Internet Protocol Version 4 (TCP/IPv4)**.
5. Pilih **Use the following IP address** dan masukkan detail berikut:
   * **IP address**: `192.168.1.100` (atau IP lain sesuai subnet router kelas)
   * **Subnet mask**: `255.255.255.0`
   * **Default gateway**: `192.168.1.1` (IP Router Anda)
6. Pilih **Use the following DNS server addresses**:
   * **Preferred DNS server**: `192.168.1.100` (Mengarah ke dirinya sendiri untuk DNS server lokal)
   * **Alternate DNS server**: `1.1.1.1` (Untuk internet jika tersambung)
7. Klik **OK** dan simpan konfigurasi.

---

## 🧭 3. Langkah 2: Konfigurasi Redireksi DNS di Router (Rekomendasi)

Hampir semua router modern (TP-Link, D-Link, Huawei, OpenWrt) memiliki fitur tabel DNS lokal bawaan yang memetakan nama domain ke IP lokal secara instan tanpa software tambahan di laptop.

### Metode A: Menggunakan Menu DNS Hosts / Static DNS di Router (Paling Mudah)
1. Buka browser dan login ke halaman admin router kelas Anda (biasanya `http://192.168.1.1` atau `http://192.168.0.1`).
2. Cari menu **Advanced Settings** -> **DNS Server** atau **DHCP Server** -> **Static DNS / Hosts**.
3. Tambahkan baris pemetaan baru:
   * **Host Name / Domain**: `dyleks.id` (dan/atau `dyleks.local`)
   * **IP Address**: `192.168.1.100` (IP Laptop Guru)
4. Simpan dan restart router.
5. Sekarang, semua ponsel yang terhubung ke Wi-Fi tersebut otomatis dapat mengakses platform hanya dengan mengetik `dyleks.id:3001`.

---

## 💻 4. Langkah 3: Konfigurasi DNS Server Lokal Ringan di Laptop (Alternatif)

Jika router kelas Anda tidak memiliki fitur DNS Hosts bawaan, Anda dapat menjalankan DNS Server lokal super ringan pada laptop guru menggunakan **Acrylic DNS Proxy** (untuk Windows).

### Menggunakan Acrylic DNS Proxy (Windows):
1. Unduh dan pasang **Acrylic DNS Proxy** (gratis & open-source).
2. Buka berkas konfigurasi hosts Acrylic pada direktori:
   `C:\Program Files (x86)\Acrylic DNS Proxy\AcrylicHosts.txt`
3. Tambahkan baris pemetaan berikut di bagian paling bawah berkas:
   ```text
   192.168.1.100 dyleks.id
   192.168.1.100 dyleks.local
   192.168.1.100 *.dyleks.id
   ```
4. Simpan berkas (butuh hak Administrator).
5. Buka **Services.msc** di Windows, cari layanan bernama **Acrylic DNS Proxy**, lalu klik **Restart**.
6. Atur agar DHCP Server pada Router kelas membagikan IP DNS utama sebagai `192.168.1.100` kepada semua ponsel murid.

---

## 🛠️ 5. Langkah 4: Penyempurnaan Port Forwarding (Port-less Access)

Agar murid tidak perlu mengetik nomor port `:3001` (misalnya cukup mengetik `http://dyleks.id`), Anda dapat memetakan port 80 (HTTP standar) ke port 3001 di Windows menggunakan perintah netsh berikut pada CMD Administrator:

```cmd
:: Mengarahkan lalu lintas HTTP Port 80 ke Port 3001 (Next.js PWA)
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.1.100 connectport=3001 connectaddress=192.168.1.100

:: Mengarahkan lalu lintas API Port 3002 (FastAPI) untuk akses eksternal
netsh interface portproxy add v4tov4 listenport=3002 listenaddress=192.168.1.100 connectport=3002 connectaddress=192.168.1.100
```

*Catatan: Pastikan untuk membuka port 80 dan 3002 pada Windows Defender Firewall menggunakan script `setup_services.bat` atau installer Inno Setup.*
