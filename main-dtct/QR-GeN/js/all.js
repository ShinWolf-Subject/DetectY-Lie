        const wrapper = document.querySelector(".wrapper");
        const qrInput = wrapper.querySelector(".form input");
        const generateBtn = document.getElementById("generate-btn");
        const downloadBtn = document.getElementById("download-btn");
        const qrImg = wrapper.querySelector(".qr-code img");
        const statusMessage = document.getElementById("status-message");

        let preValue;
        let currentQRValue = "";

        // Fungsi untuk menampilkan pesan status
        function showStatus(message, type = "") {
            statusMessage.textContent = message;
            statusMessage.className = "status-message " + type;
            statusMessage.style.display = "block";

            // Sembunyikan pesan setelah 5 detik
            setTimeout(() => {
                statusMessage.style.display = "none";
            }, 5000);
        }

        // Fungsi untuk membuat nama file berdasarkan URL
        function generateFileName(url) {
            try {
                // Jika input adalah URL yang valid
                const urlObj = new URL(url);
                let domain = urlObj.hostname.replace('www.', '');
                let path = urlObj.pathname !== '/' ? urlObj.pathname.replace(/\//g, '-').replace(/^-|-$/g, '') : '';

                // Hapus karakter yang tidak valid untuk nama file
                domain = domain.replace(/[^a-zA-Z0-9.-]/g, '');
                path = path.replace(/[^a-zA-Z0-9.-]/g, '');

                // Gabungkan domain dan path
                let fileName = domain;
                if (path) {
                    fileName += '-' + path;
                }

                // Potong nama file jika terlalu panjang
                if (fileName.length > 50) {
                    fileName = fileName.substring(0, 50);
                }

                return fileName || 'qr-code';
            } catch (e) {
                // Jika input bukan URL yang valid, gunakan sebagai teks biasa
                let text = url.substring(0, 30);
                text = text.replace(/[^a-zA-Z0-9]/g, '-');
                return text || 'qr-code';
            }
        }

        // Fungsi untuk mengkonversi gambar ke blob dan mendownload
        async function downloadQR() {
            if (!currentQRValue) {
                showStatus("Tidak ada QR Code yang bisa didownload. Generate QR Code terlebih dahulu.", "error");
                return;
            }

            try {
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = "Downloading...";

                // Fetch gambar dari URL dan konversi ke blob
                const response = await fetch(qrImg.src);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const blob = await response.blob();

                // Buat nama file berdasarkan URL/teks
                const fileName = generateFileName(currentQRValue);

                // Buat object URL dari blob
                const url = window.URL.createObjectURL(blob);

                // Buat elemen <a> untuk download
                const downloadLink = document.createElement('a');
                downloadLink.style.display = 'none';
                downloadLink.href = url;
                downloadLink.download = `${fileName}-qrcode.png`;

                // Tambahkan ke DOM, klik, lalu hapus
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

                // Bersihkan object URL
                window.URL.revokeObjectURL(url);

                downloadBtn.disabled = false;
                downloadBtn.innerHTML = "Download QR Code";
                showStatus("QR Code berhasil didownload!", "success");

            } catch (error) {
                console.error("Error downloading QR code:", error);
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = "Download QR Code";
                showStatus("Error saat mendownload QR Code. Coba lagi.", "error");
            }
        }

        // Event listener untuk generate QR code
        generateBtn.addEventListener("click", () => {
            let qrValue = qrInput.value.trim();
            if (!qrValue) {
                showStatus("Masukkan URL atau teks terlebih dahulu!", "error");
                return;
            }

            if (preValue === qrValue) {
                showStatus("QR Code sudah digenerate untuk URL/teks ini.", "error");
                return;
            }

            preValue = qrValue;
            currentQRValue = qrValue;

            // Nonaktifkan tombol dan tampilkan status loading
            generateBtn.disabled = true;
            generateBtn.innerText = "Generating...";
            downloadBtn.disabled = true;

            // Sembunyikan status message sebelumnya
            statusMessage.style.display = "none";

            // Encode value untuk URL
            const encodedValue = encodeURIComponent(qrValue);
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedValue}`;

            qrImg.addEventListener("load", () => {
                wrapper.classList.add("active");
                generateBtn.disabled = false;
                generateBtn.innerText = "Generate QR Code";
                downloadBtn.disabled = false;
                showStatus("QR Code berhasil digenerate! Klik Download untuk menyimpan.", "success");
            });

            qrImg.addEventListener("error", () => {
                generateBtn.disabled = false;
                generateBtn.innerText = "Generate QR Code";
                downloadBtn.disabled = true;
                showStatus("Terjadi kesalahan saat membuat QR Code. Coba lagi.", "error");
            });
        });

        // Event listener untuk tombol download
        downloadBtn.addEventListener("click", downloadQR);

        // Event listener untuk input
        qrInput.addEventListener("keyup", () => {
            if (!qrInput.value.trim()) {
                wrapper.classList.remove("active");
                preValue = "";
                currentQRValue = "";
                downloadBtn.disabled = true;
            }
        });

        qrInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                generateBtn.click();
            }
        });