const ffmpegURL = `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip`
let ffmpegPath, encoder = 'libx264', preset = 'slow'

async function check() {
    console.log('Checking for ffmpeg... (System-wide)')
    let checkFFmpeg = await Neutralino.os.execCommand('ffmpeg -version')
    let exitCode = checkFFmpeg.exitCode
    if (exitCode !== 0) {
        ffmpegPath = NL_CWD + '/ffmpeg.exe'
        check2();
    } else {
        document.getElementById('firstStart').style.visibility = 'hidden';
        document.getElementById('main').style.visibility = 'visible';
        document.getElementById('encoderSelection').style.visibility = 'visible';
        // document.getElementById('resolutionSelection').style.visibility = 'visible';
        ffmpegPath = 'ffmpeg'
    }
}
async function check2() {
    console.log('Checking for ffmpeg... (Local)')
    let checkFFmpeg = await Neutralino.os.execCommand(ffmpegPath + ' -version')
    let exitCode = checkFFmpeg.exitCode
    console.log()
    if (exitCode !== 0) {
        ffmpegPath = NL_CWD + '/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe'
        check3()
    } else {
        checkHardware()
        document.getElementById('firstStart').style.visibility = 'hidden';
        document.getElementById('encoderSelection').style.visibility = 'visible';
        document.getElementById('main').style.visibility = 'visible';
        // document.getElementById('resolutionSelection').style.visibility = 'visible';
    }
}

async function check3() {
    console.log('Checking for ffmpeg... (Local 2)')
    console.log(ffmpegPath)
    let checkFFmpeg = await Neutralino.os.execCommand(ffmpegPath + ' -version')
    let exitCode = checkFFmpeg.exitCode
    if (exitCode !== 0) {
        document.getElementById('firstStart').innerHTML = `
        <h1>FFmpeg not found</h1>
        <p>The program will be starting the download of FFmpeg, please wait...</p>
        <p>After the download is complete, the program will restart itself.</p>
        `
        await downloadFFmpeg();
    } else {
        checkHardware()
        document.getElementById('firstStart').style.visibility = 'hidden';
        document.getElementById('main').style.visibility = 'visible';
        document.getElementById('encoderSelection').style.visibility = 'visible';
        // document.getElementById('resolutionSelection').style.visibility = 'visible';
    }
}

async function downloadFFmpeg() {
    const message = `powershell -Command "(New-Object System.Net.WebClient).DownloadFile('${ffmpegURL}', '${NL_CWD}/ffmpeg.zip')"`
    const pw1 = await Neutralino.os.execCommand(message)
    const pw2 = await Neutralino.os.execCommand(`powershell -Command "Expand-Archive -Path '${NL_CWD}/ffmpeg.zip' -DestinationPath '${NL_CWD}'"`)
    const pw3 = await Neutralino.os.execCommand(`powershell -Command "Remove-Item '${NL_CWD}/ffmpeg.zip'"`)
    Neutralino.app.restartProcess();
}


function onWindowClose() {
    Neutralino.app.exit();
}

Neutralino.init();
check()

Neutralino.events.on("windowClose", onWindowClose);

document.getElementById("inputFile").addEventListener("click", openFile);

let filePath, filename
async function openFile() {
    let entries = await Neutralino.os.showOpenDialog('Choose the video you want to re-encode!', {
        filters: [
            { name: 'Videos', extensions: ['mp4', 'mkv', 'avi'] }
        ]
    });
    filePath = entries[0];

    filename = entries[0].split('/')[filePath.split('/').length - 1];
    const fileNameA = document.getElementById("fileName");
    fileNameA.innerText = filename
}

document.getElementById("convert").addEventListener("click", convert);

async function convert() {
    Neutralino.os.showNotification('Converting...', 'Converting your video, please wait...');

    let args = [
        ffmpegPath,
        '-i',
        `"${filePath}"`,
        '-c:v',
        encoder,
        `-vf "scale=-1:720"`,
        '-crf 23',
        '-maxrate 1.6M',
        `-preset veryslow`,
        `"${filePath.split('/').slice(0, -1).join('/')}/${filename.split('.')[0]}_60fps.mp4"`, '-y'
    ]
    console.log(args.join(' '))
    let logDiv = document.getElementById("logContent")
    logDiv.innerHTML = ''
    let convert = await Neutralino.os.spawnProcess(args.join(' '))
    Neutralino.events.on('spawnedProcess', (evt) => {
        if (convert.id == evt.detail.id) {
            switch (evt.detail.action) {
                case 'stdOut':
                    console.log(evt.detail.data);
                    break;
                case 'stdErr':
                    const p2 = document.createElement('p');
                    p2.innerText = evt.detail.data;
                    logDiv.appendChild(p2);
                    if (evt.detail.data.includes('width not divisible by 2')) {
                        const p = document.createElement('p');
                        p.innerText = 'The video resolution is not divisible by 2, the conversion will be skipped.';
                        logDiv.appendChild(p);
                    }
                    logDiv.scrollTop = logDiv.scrollHeight;
                    break;
                case 'exit':
                    const p = document.createElement('p');
                    p.innerText = 'Conversion completed!';
                    logDiv.appendChild(p);
                    logDiv.scrollTop = logDiv.scrollHeight;
                    Neutralino.os.showNotification('Finished!', 'Conversion completed!');
                    console.log(`Ping process terminated with exit code: ${evt.detail.data}`);
                    break;
            }
        }
    })

}

var rad = document.encoderSelect.encoder;
var prev = null;
for (var i = 0; i < rad.length; i++) {
    rad[i].addEventListener('change', function () {
        if (this !== prev) {
            prev = this;
        }
        encoder = this.value
        console.log(encoder)
    });
}
