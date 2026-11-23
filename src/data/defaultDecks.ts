import { QuizDeck } from '../types/quiz';

export const DEFAULT_DECKS: QuizDeck[] = [
  {
    id: 'deck-khtn6',
    title: 'KHTN 6 — Khoa học Tự nhiên lớp 6',
    category: 'Khoa học',
    description:
      'Bộ câu hỏi trắc nghiệm trọng tâm chương trình Khoa học Tự nhiên 6: phép đo, chất và sự biến đổi, tế bào, đa dạng thế giới sống, lực và năng lượng.',
    defaultTimeSec: 15,
    isBuiltIn: true,
    updatedAt: '2026-11-22',
    questions: [
      {
        id: 'khtn6-1',
        prompt: 'Đơn vị đo chiều dài hợp pháp trong hệ thống đo lường chính thức của nước ta (hệ SI) là gì?',
        options: ['Xentimét (cm)', 'Mét (m)', 'Kilômét (km)', 'Milimét (mm)'],
        correctIndex: 1,
        explanation: 'Trong hệ đơn vị đo lường hợp pháp SI, đơn vị cơ bản đo chiều dài là mét (kí hiệu: m).',
      },
      {
        id: 'khtn6-2',
        prompt: 'Dụng cụ nào sau đây dùng để đo khối lượng của một vật?',
        options: ['Thước dây', 'Đồng hồ bấm giây', 'Cân đồng hồ', 'Nhiệt kế'],
        correctIndex: 2,
        explanation: 'Cân là dụng cụ dùng để đo khối lượng; thước đo chiều dài, đồng hồ đo thời gian, nhiệt kế đo nhiệt độ.',
      },
      {
        id: 'khtn6-3',
        prompt: 'Ở điều kiện áp suất tiêu chuẩn, nước tinh khiết sôi ở nhiệt độ bao nhiêu?',
        options: ['0 °C', '37 °C', '100 °C', '120 °C'],
        correctIndex: 2,
        explanation: 'Nước tinh khiết đông đặc (nóng chảy) ở 0 °C và sôi ở 100 °C tại áp suất khí quyển tiêu chuẩn.',
      },
      {
        id: 'khtn6-4',
        prompt: 'Trong không khí sạch, khí Oxygen (O₂) chiếm khoảng bao nhiêu phần trăm theo thể tích?',
        options: ['78%', '21%', '1%', '50%'],
        correctIndex: 1,
        explanation: 'Không khí gồm khoảng 78% khí Nitrogen, 21% khí Oxygen và 1% các khí khác (Carbon dioxide, hơi nước, khí hiếm...).',
      },
      {
        id: 'khtn6-5',
        prompt: 'Quá trình chất chuyển từ thể lỏng sang thể khí (hơi) ở bề mặt chất lỏng được gọi là gì?',
        options: ['Sự nóng chảy', 'Sự đông đặc', 'Sự bay hơi', 'Sự ngưng tụ'],
        correctIndex: 2,
        explanation: 'Sự chuyển từ thể lỏng sang thể hơi diễn ra ở bề mặt chất lỏng gọi là sự bay hơi.',
      },
      {
        id: 'khtn6-6',
        prompt: 'Đơn vị cơ bản cấu tạo nên mọi cơ thể sinh vật sống là gì?',
        options: ['Mô', 'Cơ quan', 'Tế bào', 'Hệ cơ quan'],
        correctIndex: 2,
        explanation: 'Mọi cơ thể sinh vật từ đơn bào đến đa bào đều được cấu tạo từ tế bào — đơn vị cấu trúc và chức năng cơ bản của sự sống.',
      },
      {
        id: 'khtn6-7',
        prompt: 'Bào quan nào chỉ có ở tế bào thực vật (và một số sinh vật quang hợp), giúp cây tự tổng hợp chất hữu cơ nhờ ánh sáng?',
        options: ['Nhân tế bào', 'Lục lạp', 'Ti thể', 'Màng sinh chất'],
        correctIndex: 1,
        explanation: 'Lục lạp chứa sắc tố diệp lục giúp tế bào thực vật thực hiện quá trình quang hợp.',
      },
      {
        id: 'khtn6-8',
        prompt: 'Trong 5 giới sinh vật (Khởi sinh, Nguyên sinh, Nấm, Thực vật, Động vật), vi khuẩn thuộc giới nào?',
        options: ['Giới Khởi sinh', 'Giới Nguyên sinh', 'Giới Nấm', 'Giới Thực vật'],
        correctIndex: 0,
        explanation: 'Vi khuẩn là sinh vật đơn bào nhân sơ, thuộc giới Khởi sinh.',
      },
      {
        id: 'khtn6-9',
        prompt: 'Đơn vị đo lực chuẩn trong hệ SI là gì?',
        options: ['Kilôgam (kg)', 'Niutơn (N)', 'Jun (J)', 'Mét trên giây (m/s)'],
        correctIndex: 1,
        explanation: 'Đơn vị đo lực là Niutơn (kí hiệu: N), đặt theo tên nhà bác học Isaac Newton.',
      },
      {
        id: 'khtn6-10',
        prompt: 'Dạng năng lượng nào sau đây là nguồn năng lượng tái tạo, sạch và thân thiện với môi trường?',
        options: ['Than đá', 'Dầu mỏ', 'Năng lượng gió và Mặt Trời', 'Khí đốt tự nhiên'],
        correctIndex: 2,
        explanation: 'Năng lượng gió và năng lượng Mặt Trời là các nguồn năng lượng tái tạo, hầu như vô tận và ít gây ô nhiễm môi trường.',
      },
    ],
  },
];
