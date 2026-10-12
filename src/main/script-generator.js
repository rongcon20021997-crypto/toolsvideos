/**
 * Script & Storyboard Generator for Veo 3 Video Studio
 * Supports AI-driven generation via Gemini API or high-quality procedural templates (offline)
 */

class ScriptGenerator {
  /**
   * Procedural template generator for 10-20 scenes (No API key needed, offline instant)
   */
  generateProceduralScenes({
    count = 10,
    topic = 'Cuộc phiêu lưu trong thành phố tương lai',
    characterName = 'Alex',
    characterOutfit = 'áo khoác phi hành gia phản quang',
    artStyle = 'Cinematic 8K, photorealistic, anamorphic lens, blade runner aesthetic'
  }) {
    const shotTypes = [
      'Establishing Wide Shot, atmospheric drone view',
      'Medium Close-up, cinematic shallow depth of field',
      'Over-The-Shoulder dynamic tracking shot',
      'Low Angle heroic perspective, dramatic volumetric light rays',
      'Smooth Steadicam follow shot, moving through corridor',
      'Extreme Close-up on intense eyes and facial expression',
      'Side Profile tracking dolly shot, slow motion 60fps',
      'Dutch angle suspenseful tilt, neon rim light reflections',
      'Bird-eye high angle view, geometric city architecture',
      'Action Tracking shot with subtle motion blur',
      'Slow Push-in towards the character face',
      'Orbit 360 degree pan around character standing firm',
      'Fast Whip pan transition into mystery subject',
      'Point-of-view (POV) perspective looking ahead',
      'Ground-level low glide shot moving with boots walking',
      'Silhouette shot against glowing backdrop',
      'Rack focus from foreground object to character eyes',
      'Dynamic crane shot rising up into the sky',
      'Intense medium portrait shot with wind blowing hair',
      'Climactic wide landscape shot at sunset with epic golden hour'
    ];

    const actions = [
      `bước ra khỏi làn sương mù, quan sát xung quanh với ánh mắt kiên định`,
      `kiểm tra thiết bị công nghệ cầm tay, ánh sáng màn hình hắt lên khuôn mặt`,
      `di chuyển nhanh qua con hẻm hẹp rực rỡ đèn neon, bước chân dứt khoát`,
      `dừng lại trước cánh cổng bảo mật khổng lồ, chuẩn bị mở khóa`,
      `phát hiện manh mối bí ẩn trên mặt đất, cẩn thận quỳ xuống xem xét`,
      `ngẩng đầu nhìn lên các tòa tháp chọc trời, gió thổi nhẹ tà áo`,
      `kích hoạt thiết bị bay mini lơ lửng bên cạnh`,
      `bước vào căn phòng thí nghiệm bỏ hoang với ánh đèn nhấp nháy`,
      `đối mặt với hiểm nguy vô hình, tư thế phòng thủ sẵn sàng`,
      `tìm thấy chiếc hộp năng lượng phát sáng màu xanh ngọc bích`,
      `chạy thoát qua hành lang khi hệ thống báo động đỏ rực vang lên`,
      `nhảy qua khe nứt trên tầng thượng của tòa nhà cao tầng`,
      `bắt gặp tín hiệu liên lạc từ đồng đội bí ẩn`,
      `giải mã mật mã số học hiển thị trên bảng điều khiển không gian`,
      `nhìn thấy bình minh đang dần ló rạng qua khung cửa kính khổng lồ`,
      `cất bước tiến về phía phi thuyền đang đợi sẵn ở bãi đáp`,
      `nhìn lại phía sau một lần cuối với nụ cười nhẹ tự tin`,
      `đội chiếc mũ bảo hộ chuẩn bị cho chặng đường tiếp theo`,
      `bước lên bục điều khiển trung tâm, kích hoạt động cơ chính`,
      `đứng trên đỉnh cao ngắm nhìn toàn cảnh thành phố chuyển mình sang kỷ nguyên mới`
    ];

    const scenes = [];
    const actualCount = Math.min(20, Math.max(5, count));

    for (let i = 0; i < actualCount; i++) {
      const shot = shotTypes[i % shotTypes.length];
      const action = actions[i % actions.length];
      const sceneNum = i + 1;

      scenes.push({
        id: 'scene_' + Date.now() + '_' + i,
        number: sceneNum,
        title: `Phân cảnh ${sceneNum}: ${shot.split(',')[0]}`,
        shotType: shot,
        actionText: action,
        prompt: `${shot}. ${characterName} ${action}. ${characterOutfit}, ${artStyle}. Masterpiece, hyper-detailed, high-contrast cinematic lighting.`,
        duration: 6,
        aspectRatio: '16:9',
        referenceImage: null,
        status: 'idle', // idle, queued, generating, completed, failed
        progress: 0,
        videoPath: null,
        videoUrl: null,
        error: null
      });
    }

    return scenes;
  }

  /**
   * AI-generated storyboard using Gemini / Generative Language API
   */
  async generateAiScenes({
    apiKey,
    count = 10,
    topic,
    characterProfile,
    model = 'gemini-1.5-flash'
  }) {
    if (!apiKey) {
      return this.generateProceduralScenes({
        count,
        topic,
        characterName: characterProfile?.name || 'Nhân vật',
        characterOutfit: characterProfile?.outfit || 'trang phục đặc trưng',
        artStyle: characterProfile?.artStyle || 'Cinematic 8K'
      });
    }

    const cleanModel = model.replace(/^models\//, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;

    const systemPrompt = `You are an elite cinematic movie director and prompt engineer for Google Veo 3 video generator.
Your job is to generate exactly ${count} chronological video scenes based on the user's story topic and character.
Each scene must maintain strict character visual consistency.
You must return ONLY a valid JSON array of objects with the following schema, no markdown wrapping, no explanation:
[
  {
    "number": 1,
    "title": "Short title in Vietnamese",
    "shotType": "Camera shot description (e.g. Extreme Close-Up, Tracking Shot, Wide Angle)",
    "actionText": "Short action description in Vietnamese",
    "prompt": "Detailed cinematic English prompt for Veo 3 with camera motion, lighting, character action and consistent details",
    "duration": 6,
    "aspectRatio": "16:9"
  }
]`;

    const userContent = `Story Topic: ${topic}
Character Info:
- Name: ${characterProfile?.name || 'Protagonist'}
- Gender & Age: ${characterProfile?.gender || 'Unspecified'}, ${characterProfile?.age || '25-30'}
- Appearance: ${characterProfile?.appearance || 'Athletic, sharp facial features'}
- Outfit: ${characterProfile?.outfit || 'Signature cinematic jacket and boots'}
- Art style: ${characterProfile?.artStyle || 'Cinematic 8K photorealistic photogrammetry'}

Generate exactly ${count} sequential scenes.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userContent}` }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Gemini API Error: ${data?.error?.message || response.statusText}`);
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No script response returned from AI');

    try {
      const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      if (Array.isArray(parsed)) {
        return parsed.map((sc, index) => ({
          id: 'scene_' + Date.now() + '_' + index,
          number: sc.number || index + 1,
          title: sc.title || `Phân cảnh ${index + 1}`,
          shotType: sc.shotType || 'Cinematic Shot',
          actionText: sc.actionText || '',
          prompt: sc.prompt,
          duration: sc.duration === 4 || sc.duration === 8 ? sc.duration : 6,
          aspectRatio: sc.aspectRatio || '16:9',
          referenceImage: null,
          status: 'idle',
          progress: 0,
          videoPath: null,
          videoUrl: null,
          error: null
        }));
      }
    } catch (e) {
      console.warn('Failed to parse AI JSON, falling back to procedural:', e);
    }

    return this.generateProceduralScenes({
      count,
      topic,
      characterName: characterProfile?.name || 'Alex',
      characterOutfit: characterProfile?.outfit || 'trang phục đặc trưng',
      artStyle: characterProfile?.artStyle || 'Cinematic 8K'
    });
  }
}

module.exports = new ScriptGenerator();
