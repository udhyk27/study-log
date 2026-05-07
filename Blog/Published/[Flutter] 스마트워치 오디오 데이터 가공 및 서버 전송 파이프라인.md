스마트워치 환경에서 실시간으로 음성 데이터를 녹음하고, 이를 가공하여 서버로 전송하는 파이프라인 구축 과정을 정리해 보려고 한다.

일반적인 모바일 앱 개발 시에는 기기의 마이크를 열어 원시 오디오(PCM) 데이터를 녹음하고, 앱 내에서 가공한 뒤 곧바로 서버 API를 호출해 전송하면 그만이었다. 스마트폰은 항상 안정적인 인터넷 연결이 보장되기 때문에 통신에 별다른 제약이 없었다. 하지만 스마트워치 환경은 사정이 조금 다르다.

스마트워치(Wear OS 등)는 배터리 소모를 최소화하기 위해 스마트폰과 블루투스로 페어링 된 상태에서는 워치 자체의 Wi-Fi 연결을 자동으로 비활성화한다. 즉, 사용자가 폰과 워치를 연결해 둔 가장 일상적인 상황에서는 워치가 단독으로 외부 서버와 HTTP 통신을 할 수 없게 되는 것이다.

이러한 제약을 극복하기 위해, 현재 워치의 네트워크 통신 상태에 따라 데이터 전송 경로(Routing)를 분리했다.

1. 단독망 연결 (Wi-Fi): 워치에서 서버로 직접 가공 데이터 전송
2. 페어링 상태 (Bluetooth): 워치에서 스마트폰(Kotlin) 으로 가공 데이터 전송 → 스마트폰에서 서버로 전송

본문에서는 워치에서 마이크 및 인터넷을 사용하고, 스마트폰과 원활하게 데이터를 주고받기 위한 필수 권한 세팅을 시작으로, 통신망 분기 처리 방법과 Kotlin을 활용해 폰과 데이터를 주고받는 구체적인 과정을 단계별로 다루어 보겠다.

 

    AndroidManifest.xml 필수 권한 세팅

<!-- 마이크 권한 -->
<uses-permission
android:name="android.permission.RECORD_AUDIO"/>
<!-- 진동, 인터넷, 네트워크 상태 관련 권한 -->
<uses-permission
android:name="android.permission.VIBRATE"/>
<uses-permission
android:name="android.permission.INTERNET"/>
<uses-permission
android:name="android.permission.ACCESS_NETWORK_STATE"/>
<!-- 블루투스 관련 권한 -->
<uses-permission
android:name="android.permission.BLUETOOTH"/>
<uses-permission
android:name="android.permission.BLUETOOTH_ADMIN"/>
<!-- 위치 관련 권한 (BLUETOOTH_SCAN을 사용하는 데 필요) -->
<uses-permission
android:name="android.permission.ACCESS_FINE_LOCATION"/>
<!-- Android 12 이상에서 필요한 권한 -->
<uses-permission
android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission
android:name="android.permission.BLUETOOTH_SCAN"/>
<!-- Foreground Service 관련 권한 -->
<uses-permission
android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission
android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE"/>
<uses-permission
android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC"/>
<!-- 부팅 후 앱 실행 관련 권한 -->
<uses-permission
android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>

 

 

 

1. 마이크에서 버퍼 수신 (보통 48000Hz)
2. AVAudioConverter를 통해 → 16000Hz 변환
3. float32ToInt16 → int16ArrayToBytes → wbuf.push()
4. wbuf.length >= fftN * 2일 때 → read + dna.push + pop
5. dna.length == qLen → 서버 전송 (32개 쌓였을 때)

 

1. 초기화 및 녹음 준비 (init)
네트워크 확인: 현재 통신 상태가 블루투스인지, Wi-Fi/셀룰러인지 확인합니다.
블루투스 연결 (선택): 블루투스 환경일 경우 권한을 확인하고 폰(Kotlin)과의 세션을 시작합니다.

// 블루투스일때만 블루투스 권한 및 세션 시작
    if (recController.networkType.value == 'bluetooth') {
      // 권한 요청
      final granted = await platform.invokeMethod('checkAndRequestBluetoothPermissions');
      if (granted == true) {
        // 세션 시작
        final success = await platform.invokeMethod('startSession');
        if (!success) {
          // Fluttertoast.showToast(msg: "블루투스 연결이 원활하지 않습니다.");
        }
      }
    }


스트림 리스닝: 마이크로부터 들어올 오디오 데이터를 받을 스트림(_audioStream)을 열고 대기합니다.

2. 녹음 시작 (start)
녹음기 가동: 16kHz(srate), 모노 채널로 마이크 녹음을 시작합니다.
타이머 설정: 10초 뒤에 녹음이 자동 종료되도록 타이머를 설정합니다. (무한 녹음 방지)

3. 오디오 데이터 수신 및 쪼개기 (_audioStream.listen)
데이터 수신: 마이크에서 PCM 오디오 데이터가 청크(Chunk) 단위로 들어옵니다.
플랫폼별 분기 처리: * iOS: 데이터가 한 번에 크게(약 180ms) 들어오기 때문에, 처리를 위해 작은 크기(fftHop * 2)로 잘게 나누어 파동 버퍼(_wbuf)에 넣습니다.
Android: 짧은 주기(약 20ms)로 들어오므로 그대로 파동 버퍼(_wbuf)에 넣습니다.

_audioStream = recCtrl.stream.listen((buffer) async {
      // print('data received at: ${DateTime.now()} - buffer size: ${buffer.length}');
      // iOS일때 180ms에 한번씩 들어오는 데이터 청크 3개로 나누어 dna에 각각 담아서 버퍼에 쌓음
      // iOS는 큰 청크로 들어오므로 작은 청크로 나눔
      if (Platform.isIOS && buffer.length > fftHop * 2) {
        // 큰 버퍼를 작은 청크로 분할하여 처리
        int offset = 0;
        while (offset < buffer.length) {
          int chunkSize = min(fftHop * 2, buffer.length - offset);
          Uint8List chunk = buffer.sublist(offset, offset + chunkSize);

          _wbuf.push(chunk);
          _processBuffer(); // 버퍼 처리

          offset += chunkSize;
        }
      } else {
        // Android => 20ms에 한번씩 들어옴, dna에 각각 넣어 버퍼에 쌓음
        _wbuf.push(buffer);
        _processBuffer();
      }
    });



4. 버퍼 누적 및 DNA 변환 (_processBuffer)
파동 데이터 누적: 파동 버퍼(_wbuf)에 일정량(fftN * 2)의 오디오 데이터가 쌓일 때까지 기다립니다.
DNA 추출: 충분히 데이터가 쌓이면 이를 읽어와 고유의 특징점인 DNA 버퍼(_dna)에 밀어 넣습니다 (push).
버퍼 정리: 처리가 끝난 앞부분의 파동 데이터는 버퍼에서 버립니다 (pop).

  void _processBuffer() {
    if (_wbuf.length >= fftN * 2) {
      _wbuf.read(fftN * 2, _pcm);
      _dna.push(_pcm);
      _wbuf.pop(fftHop * 2);

      // print('dna length :: ${_dna.length}');

      if (_dna.length == qLen) {
        print('32개의 DNA 쌓임, 서버로 전송 !!');
        _sendDnaToServerAndProcess();
      }
    }
  }


5. 조건 도달 시 서버/폰으로 데이터 전송 (_sendDnaToServerAndProcess)
전송 트리거: DNA 버퍼에 32개(qLen)의 조각이 모이면 전송을 시작합니다.
네트워크 분기 전송:
블루투스 상태: 워치에서 직접 서버로 보내지 않고, 플랫폼 채널을 통해 연결된 스마트폰(Kotlin)으로 DNA 데이터를 전달합니다. (_sendDataToKotlin)
Wi-Fi/셀룰러 상태: 워치에서 HTTP POST 요청을 통해 직접 모모 서버 API로 전송합니다. (sendDnaToServer)
버퍼 비우기: 전송을 마친 32개의 DNA 데이터는 버퍼에서 버립니다.

  Future<void> _sendDnaToServerAndProcess() async {
    print('DNA ${qLen}개 도달: ${DateTime.now()}');

    var m = <String, dynamic>{};

    if (recController.networkType.value == 'bluetooth') {
      await _sendDataToKotlin(_dna.pack());  // 데이터를 폰으로 전송
    } else { // 셀룰러 또는 와이파이 일때
      // HTTP 요청 호출
      m = await sendDnaToServer(_dna.pack());
    }

    // 에러 메시지가 존재할 때
    if (m['err_msg'] != '' &&  m.containsKey('err_msg')) {
      print('error msg 1 / 음악 인식 STOP');
      print(m['err_msg']);

      await stop();
    }

    if (m['data'] != '' && m.containsKey('data')) {
      // print('찾기까지 걸린 종료시간 :: ${DateTime.now()}');
      HapticFeedback.lightImpact();

      _ctrl.sink.add(m);
      _cur = m;

      final song = m['data'];

      if (recController.networkType.value != 'bluetooth') { // 블루투스 아닐 때는 여기서 화면 이동
        await Get.to(() => SongInfo(song: song));
        await stop();
      }
    }
    _dna.pop(qLen);
  }


6. 음악 인식 결과 처리 및 종료 (_sendDnaToServerAndProcess & bluetoothReceiver)
에러 발생 시: 서버 응답 지연(Timeout)이나 에러 메시지가 오면 즉시 녹음을 중단(stop)합니다.
인식 성공 시: * 찾은 음악 데이터가 오면 햅틱 진동(Light Impact)으로 사용자에게 알립니다.
(블루투스가 아닌 경우) 찾은 곡 정보 화면(SongInfo)으로 바로 이동하고 녹음을 종료합니다.
(블루투스인 경우) 폰에서 처리된 결과를 bluetoothReceiver를 통해 전달받아 화면에 반영합니다.
메모리 해제 (dispose): 작업이 완전히 끝나거나 앱이 종료될 때, 마이크를 끄고 스트림을 닫으며 할당된 메모리를 해제합니다.

  // 코틀린으로 받은 음악인식 결과값 리시버
  void bluetoothReceiver(Function(String) onDataReceived) {
    // MethodChannel로 데이터 수신 처리
    platform.setMethodCallHandler((call) async {
      if (call.method == "receiveBluetoothData") {

        String receivedData = call.arguments; // 워치에서 받은 데이터
        // print("Flutter로 받은 데이터: $receivedData");

        onDataReceived(receivedData);
      }
    });
  }

 

 

트러블 슈팅
- IOS는 청크로 쪼개야 했음 (180ms마다 들어와서) 20 으로

if (Platform.isIOS && buffer.length > fftHop * 2) {
        // 큰 버퍼를 작은 청크로 분할하여 처리
        int offset = 0;
        while (offset < buffer.length) {
          int chunkSize = min(fftHop * 2, buffer.length - offset);
          Uint8List chunk = buffer.sublist(offset, offset + chunkSize);

          _wbuf.push(chunk);
          _processBuffer(); // 버퍼 처리

          offset += chunkSize;
        }
      } else {
        // Android => 20ms에 한번씩 들어옴, dna에 각각 넣어 버퍼에 쌓음
        _wbuf.push(buffer);
        _processBuffer();
      }


- 폰과 연결된 상태에서는 와이파이 연결이 해제되어 워치 자체적으로 API를 사용할 수 없었다. 블루투스로 연결된 휴대폰 디바이스에 녹음 데이터를 보내서 API를 이용해야 했음

- 폰에서 받은 바이트 배열을 다시 JSON 문자열로 변환하여 워치 Flutter코드로 넘기는 Kotlin 코드

private fun startListeningForIncomingData() {
        Thread {
            try {
                val inputStream = bluetoothSocket?.inputStream // 데이터 받을 inputStream 설정
                if (inputStream == null) {
                    Log.e("WatchDebug", "(워치 코틀린)블루투스 소켓 입력 스트림이 없습니다.")
                    return@Thread
                }

                val buffer = ByteArray(1024)  // 데이터를 받을 버퍼 크기 설정

                while (true) {
                    val bytesRead = inputStream.read(buffer)  // 데이터를 읽음

                    // 읽은 바이트가 0 이하일 경우 연결이 끊어졌다는 의미
                    if (bytesRead == -1) {
                        Log.e("WatchDebug", "(워치 코틀린)연결이 종료되었습니다.")
                        break // 루프 종료
                    }

                    if (bytesRead > 0) { // 읽은 바이트가 있다면
                        val received = String(buffer, 0, bytesRead)  // 바이트 배열을 문자열로 변환
                        Log.d("WatchDebug", "(워치 코틀린)휴대폰으로부터 받은 데이터: $received")  // 로그로 출력
//                        sendDataToFlutter(received)
                        val receivedPart = String(buffer, 0, bytesRead)
                        stringBuffer.append(receivedPart)

                        val currentData = stringBuffer.toString().trim()

                        // 간단히 완전한 JSON 배열인지 체크
                        if (
                            (currentData.startsWith("[") && currentData.endsWith("]")) ||
                            (currentData.startsWith("{") && currentData.endsWith("}"))
                            ) {
                            Log.d("WatchDebug", "완전한 JSON 데이터 수신: $currentData")
                            sendDataToFlutter(currentData) // 플러터로 보냄

                            // 버퍼 초기화
                            stringBuffer.clear()
                        }

                    }
                }
            } catch (e: Exception) {
                Log.e("WatchDebug", "(워치 코틀린)데이터 수신 오류: ${e.message}")
            }
        }.start()
    }
    
        // 워치(플러터)로 결과값 보냄
    private fun sendDataToFlutter(data: String) {
        try {
//            Log.d("WatchDebug", "(워치 코틀린) => 워치 플러터로 보낼 결과 데이터 $data")

            if (data.startsWith("{") && data.endsWith("}")) { // DNA 작업일 때
                val json = JSONObject(data)  // JSON 문자열 파싱
                val retVal = json.getInt("ret")  // "ret" 값을 int로 추출

                if (retVal == 0) {
                    // UI 작업은 플러터에서 하도록 넘겨주기
                    Handler(Looper.getMainLooper()).post {
                        try {
                            methodChannel?.invokeMethod("receiveBluetoothData", data)
                        } catch (e: Exception) {
                            Log.e("WatchDebug", "(워치 코틀린) DNA Flutter로 데이터 전송 오류 !!: ${e.message}")
                        }
                    }
                } else {
                    Log.d("WatchDebug", "ret 값이 0이 아니므로 Flutter로 전달 안 함. 현재 값: $retVal")
                }
            }

            Handler(Looper.getMainLooper()).post { // 히스토리 목록 일 때
                try {
                    methodChannel?.invokeMethod("receiveBluetoothData", data)
                } catch (e: Exception) {
                    Log.e("WatchDebug", "(워치 코틀린) 히스토리 Flutter로 데이터 전송 오류 @@: ${e.message}")
                }
            }

        } catch (e: Exception) {
            Log.e("WatchDebug", "(워치 코틀린)Flutter로 데이터 전송 오류 #2: ${e.message}")
        }
    }