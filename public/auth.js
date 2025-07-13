const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapButton = document.getElementById('snap');
const storedImage = document.getElementById('stored-image');
const qrcodeCanvas = document.getElementById('qrcode-canvas');
const usernameInput = document.getElementById('username');
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing webcam:', error);
    });

snapButton.addEventListener('click', () => {
    const userName = usernameInput.value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const imageUrl = canvas.toDataURL('image/png');
    storedImage.src = imageUrl;
    storedImage.style.display = 'block'; 
    canvas.toBlob(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'image.png');

        fetch('http://localhost:5500/upload-image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.imageUrl) {
                const fileId = data.imageUrl.split('=')[1];
                const googleDriveImageUrl = `https://drive.google.com/uc?id=${fileId}`;
                

                generateQRCodeWithText(googleDriveImageUrl, userName);
            } else {
                console.error('No image URL returned from server');
                alert('Error: No image URL returned from server');
            }
        })
        .catch(error => {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        });
    }, 'image/png');
});

function generateQRCodeWithText(imageUrl, text) {
const qrTempDiv = document.createElement('div');
const tempQR = new QRCode(qrTempDiv, {
text: imageUrl,
width: 300,
height: 300,
colorDark: 'wheat',
colorLight: 'rgb(22, 51, 40)',
correctLevel: QRCode.CorrectLevel.H
});

setTimeout(() => {
const qrImgElement = qrTempDiv.querySelector('img');

if (qrImgElement) {
    const qrBlock = document.createElement('div');
    qrBlock.style.margin = "0px ";
    qrBlock.style.width = "300px";
    qrBlock.style.height = "320px";
    qrBlock.style.textAlign = "center";
    qrBlock.style.border = "1px solid #ccc";
    qrBlock.style.paddingTop= "10px";
    qrBlock.style.position = "relative";
    qrBlock.style.bottom= "300px";
    qrBlock.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    qrBlock.style.left = "50px";
    // qrBlock.style.bottom=0px";
    qrBlock.style.borderRadius = "10px";
    qrBlock.style.backgroundColor = "rgba(0, 0, 0, 0.9)";

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    const qrImage = new Image();
    qrImage.src = qrImgElement.src;
    qrImage.onload = () => {
        ctx.drawImage(qrImage, 0, 0, 200, 200);
    
        // Draw centered text
        // Start with max font size
    let fontSize = 60;
    ctx.font = `bold ${fontSize}px Times New Roman`;

    // Reduce font size until it fits canvas width - 20px margin
    while (ctx.measureText(text).width > canvas.width - 20 && fontSize > 20) {
        fontSize--;
        ctx.font = `bold ${fontSize}px Times New Roman`;
    }
        ctx.fillStyle = 'darkred';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
        // Set download button href AFTER canvas is ready
        downloadBtn.href = canvas.toDataURL('image/jpeg');
    };
    qrBlock.appendChild(canvas);

    // Download Button
    const downloadBtn = document.createElement('a');
    downloadBtn.innerText = "Download QR";
    downloadBtn.href = canvas.toDataURL('image/jpeg');
    downloadBtn.download = `${text}_qr.jpeg`;
    downloadBtn.style.display = "block";
    downloadBtn.style.textDecoration = "none";
    downloadBtn.style.backgroundColor = "rgb(22, 51, 40)";
    downloadBtn.style.color = "wheat";
    downloadBtn.style.width = "130px";
    downloadBtn.style.padding = "10px 0px 0px 0px";
    downloadBtn.style.height = "40px";
    downloadBtn.style.border = "3px solid black";
    downloadBtn.style.position= "absolute";
    downloadBtn.style.bottom = "8%";
    downloadBtn.style.fontSize = "20px";
    downloadBtn.style.left = "30%";
    downloadBtn.style.marginTop = "90px";
    qrBlock.appendChild(downloadBtn);

    const history = document.getElementById('qr-history');
    history.insertBefore(qrBlock, history.firstChild);
}
}, 200);
}