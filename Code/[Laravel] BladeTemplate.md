# HTML 구성
1. 스타일
@push('styles')
@endpush

2. JS 임포트
@vite(['resources/js/app.js'])

3. 스크립트 코드 삽입
@push('scripts')
@endpush

4. 모달 사용
@push('modals')
@endpush

# HTML TAG 속성
@readonly(!$booleanValue)
@disabled(!$booleanValue)
@style(['display:none;' => !$booleanValue])
@selected($i == $booleanValue)>

# PHP 코드 사용
@php
@endphp

# 주석
{{-- 주석내용 --}}

# 데이터 표시
{{ $name }}

# htmlspecialchars 함수를 통과하기 때문에 escape 처리 하지 않으려면 
{!! $name !!}

# 조건문 IF
@if() , @elseif() , @else() , @endif

-- 반대
@unless ()
	content
@endunless

# 반복문
@for , @endfor
@foreach , @endforeach

# 사용자 인증 관련
@auth
@guest

