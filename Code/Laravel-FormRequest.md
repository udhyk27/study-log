# 유효성 검사
컨트롤러에서 Illuminate\Http\Request 객체가 제공하는 validate 메소드를 사용

ex)
<?php
 
namespace App\Http\Requests;
 
use Illuminate\Foundation\Http\FormRequest;
 
class BoardNameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }
 
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'board_name' => 'required',
            'top_num' => 'required',
            'bot_num' => 'required',
            'unit' => 'required',
        ];
    }
 
    public function messages()
    {
        return [
            'board_name.required' => '시작 번호는 필수 입력 항목입니다.',
            'top_num.required' => 'Top 부품 수량 필수 입력 항목입니다.',
            'bot_num.required' => 'Bot 부품 수량 입력 항목입니다.',
            'unit.required' => '차종 필수 입력 항목입니다.',
        ];
    }
}