/**
 * Script & Storyboard Generator for Veo 3 Video Studio
 * Supports AI-driven generation via Gemini API or high-quality procedural templates (offline)
 * Features Vietnamese Voiceover Narration (Giọng nam truyền cảm) & Cooking / Storyboard Templates
 */

class ScriptGenerator {
  /**
   * Procedural generator for 10-20 scenes with Vietnamese Voiceover Narration
   */
  generateProceduralScenes({
    count = 10,
    topic = 'Dạy nấu món ăn canh chua cá kho tộ đậm đà hương vị miền Tây',
    characterName = 'Đầu bếp Hoàng',
    characterOutfit = 'tạp dề bếp màu đen chuyên nghiệp',
    artStyle = 'Cinematic 4K, Food Commercial, warm lighting, mouth-watering macro, high fidelity',
    voiceGender = 'male_vi'
  }) {
    const isCooking = /nấu|ăn|món|canh|cá|kho|thịt|bếp|bánh|ẩm thực|nướng|xào|luộc|hầm|chua/i.test(topic);

    let templateScenes = [];

    if (isCooking) {
      templateScenes = [
        {
          title: 'Bước 1: Giới thiệu & Chuẩn bị nguyên liệu tươi ngon',
          shotType: 'Top-down Flat Lay 4K, Master Food Shot',
          actionText: 'sắp xếp cá tươi, dứa thơm, cà chua, bạc hà, ớt hiểm và tộ đất lên bàn bếp gỗ',
          prompt: 'Top-down 4K flat lay shot of fresh Vietnamese ingredients neatly arranged on a rustic wooden countertop: fresh cleaned fish steaks, pineapple slices, ripe red tomatoes, elephant ear stems, okra, bean sprouts, fresh red chili, and traditional clay pots. Professional culinary lighting, warm tones, 8k resolution, photorealistic.',
          voiceover: 'Chào các bạn! Hôm nay mình sẽ hướng dẫn các bạn nấu bữa cơm gia đình chuẩn vị miền Tây: Canh chua thanh mát kết hợp cùng cá kho tộ đậm đà thơm nức mũi. Trước tiên, chúng ta cùng điểm qua các nguyên liệu tươi ngon đã chuẩn bị sẵn nhé.'
        },
        {
          title: 'Bước 2: Sơ chế & Khứa cá lóc thấm vị',
          shotType: 'Macro Close-Up, Shallow Depth of Field',
          actionText: 'dùng dao sắc khứa nhẹ các đường rãnh chéo trên từng khúc cá lóc tươi bóng',
          prompt: 'Macro close-up shot of chef hands using a sharp Japanese culinary knife to gently score diagonal cuts across fresh succulent fish steaks. Clean cutting board, droplets of water glistening, crisp focus, commercial food photography style.',
          voiceover: 'Cá sau khi làm sạch với muối và chanh để khử sạch mùi tanh, các bạn khứa nhẹ vài đường trên thân cá. Cách này giúp gia vị ngấm sâu vào từng thớ thịt khi kho.'
        },
        {
          title: 'Bước 3: Ướp cá kho tộ với nước màu dừa & gia vị',
          shotType: 'Cinematic Medium Shot, Slow-Motion 60fps',
          actionText: 'rưới nước mắm truyền thống, nước màu dừa Bến Tre sánh ánh cánh gián lên cá',
          prompt: 'Cinematic slow-motion shot pouring rich amber caramelized coconut sauce and premium fish sauce over seasoned fish in a rustic clay pot. Sliced shallots, crushed garlic, and fresh cracked black pepper visible. Warm golden hour kitchen light.',
          voiceover: 'Bây giờ chúng ta ướp cá: cho vào 3 thìa nước mắm ngon, 1 thìa đường, tiêu xay, hành tím băm và đặc biệt là nước màu dừa nguyên chất để tạo màu cánh gián óng ả. Ướp trong khoảng hai mươi phút.'
        },
        {
          title: 'Bước 4: Phi thơm hành tỏi & Chiên săn mặt cá',
          shotType: 'Dynamic Eye-Level Shot, Sizzling Smoke',
          actionText: 'cho tỏi băm vào tộ đất phi vàng ươm, khói bốc nhẹ, cho cá vào trở đều',
          prompt: 'Eye-level culinary shot inside a traditional Vietnamese clay pot on a gas stove. Golden browned garlic and shallots sizzling in fragrant hot oil, smoke rising smoothly. Chef gently turning the fish steaks to sear both sides.',
          voiceover: 'Đặt tộ đất lên bếp, phi thơm tỏi băm với chút dầu ăn. Khi tỏi vừa chuyển sang màu vàng thơm lừng, các bạn cho cá vào áp chảo nhẹ cho săn chắc hai mặt lại.'
        },
        {
          title: 'Bước 5: Thêm nước dừa tươi & Đun cá kho liu riu',
          shotType: 'Close-Up Slow Push-In, Bubbling Sauce',
          actionText: 'châm nước dừa tươi vào tộ đất, nước sốt bắt đầu sôi sùng sục sánh keo',
          prompt: 'Close-up slow push-in shot of bubbling rich caramel sauce simmering around tender fish steaks in a hot earthenware pot. Steam rising, aromatic red chili floating, rich glossy texture, cinematic food video style.',
          voiceover: 'Tiếp theo, châm thêm một chén nước dừa tươi vào tộ cá. Đun lửa lớn cho sôi bùng lên, sau đó hạ lửa thật nhỏ để cá ngấm từ từ, thịt cá săn chắc và nước sốt keo lại sánh mịn.'
        },
        {
          title: 'Bước 6: Nấu nước dùng canh chua dầm me thanh mát',
          shotType: 'Side Angle Glide Shot, Steam Rising',
          actionText: 'đun sôi nồi nước dùng, dầm nước cốt me chua vào rây lọc lấy nước cốt',
          prompt: 'Side angle glide shot of a steaming stainless steel pot of boiling clear broth. Chef pressing ripe tamarind pulp through a fine mesh strainer into the broth, gentle aromatic steam billowing, clean modern kitchen ambiance.',
          voiceover: 'Trong lúc đợi cá kho, chúng ta quay sang nấu nồi canh chua. Đun sôi một lít nước, dầm me chín lấy nước cốt chua thanh rồi cho vào nồi, nêm thêm chút muối và đường phèn cho ngọt dịu.'
        },
        {
          title: 'Bước 7: Thả dứa thơm & cà chua tạo màu rực rỡ',
          shotType: 'Top-Down 45 Degree Angle, Vibrant Colors',
          actionText: 'cho từng lát dứa vàng tươi và cà chua đỏ mọng vào nồi canh sôi lăn tăn',
          prompt: '45-degree angle shot dropping fresh vibrant yellow pineapple chunks and bright red ripe tomato wedges into simmering flavorful broth. Tiny bubbles, rich vivid natural colors, high saturation appetizing food aesthetics.',
          voiceover: 'Thả dứa và cà chua vào trước. Vị chua ngọt tự nhiên của dứa tiết ra sẽ làm nước dùng thơm dịu, đồng thời cà chua giúp nồi canh có màu đỏ cam vô cùng bắt mắt.'
        },
        {
          title: 'Bước 8: Thêm cá & các loại rau bắp, bạc hà, giá đỗ',
          shotType: 'Over-The-Shoulder Tracking Shot, Fresh Greens',
          actionText: 'cho cá và thả tiếp bạc hà xanh mướt, đậu bắp, giá đỗ vào nồi canh chín tới',
          prompt: 'Over-the-shoulder tracking shot adding fresh sliced okra, crunchy elephant ear stems, and fresh bean sprouts into the simmering sour soup pot. Steaming hot, fresh green colors contrasting with red broth.',
          voiceover: 'Kế đến, cho cá vào nấu chín tới. Nước sôi lại thì thả bạc hà, đậu bắp và giá đỗ vào. Nhớ là các loại rau này chỉ cần nấu chín tái để giữ được độ giòn ngọt tự nhiên nhé các bạn.'
        },
        {
          title: 'Bước 9: Nêm ngò gai, rau ngổ & tỏi phi thơm nức',
          shotType: 'Extreme Close-Up 4K, Garnish Sprinkling',
          actionText: 'rắc ngò gai, rau ngổ cắt khúc và một muỗng tỏi phi vàng rụm lên bề mặt canh',
          prompt: 'Extreme close-up shot of chef sprinkling chopped sawtooth coriander, rice paddy herb, and crispy golden fried garlic with fragrant chili oil on top of the steaming Vietnamese sweet and sour fish soup. Hyper-detailed texture.',
          voiceover: 'Tắt bếp, nêm thêm rau ngò gai, ngổ điếc cắt nhỏ và một muỗng tỏi phi vàng giòn rụm. Mùi thơm đặc trưng của rau mùi bốc lên ngào ngạt, kích thích mọi giác quan!'
        },
        {
          title: 'Bước 10: Thưởng thức bữa cơm ấm cúng Canh Chua Cá Kho Tộ',
          shotType: 'Master Cinematic Presentation, Steam Billowing 4K',
          actionText: 'bày tô canh chua nóng hổi bên cạnh tộ cá kho óng ánh và chén cơm trắng dẻo',
          prompt: 'Master cinematic wide food presentation: a steaming vibrant bowl of Canh Chua fish soup next to a sizzling caramelized fish clay pot (Ca Kho To), fresh bowl of steaming white jasmine rice and fish sauce dipping bowl. Steam rising gently, cozy family dining setting, 8k resolution, award-winning food commercial.',
          voiceover: 'Và đây là thành phẩm của chúng ta! Tô canh chua chua thanh ngọt mát, ăn cùng miếng cá kho tộ đậm đà béo ngậy và bát cơm trắng nóng hổi. Chúc các bạn và gia đình có một bữa cơm thật ngon miệng và ấm cúng!'
        }
      ];
    } else {
      // General Story / Cinematic Template
      templateScenes = [
        {
          title: 'Bước 1: Bối cảnh khởi đầu & Giới thiệu nhân vật',
          shotType: 'Establishing Wide Shot, Atmospheric Lighting',
          actionText: `xuất hiện tại bối cảnh chính, quan sát xung quanh với ánh nhìn tập trung`,
          prompt: `Establishing wide shot. ${characterName} standing in atmospheric setting, observing the surroundings with sharp focus. ${characterOutfit}, ${artStyle}. Cinematic masterpiece, volumetric lighting.`,
          voiceover: `Xin chào tất cả các bạn. Ngày hôm nay chúng ta bắt đầu hành trình đặc biệt này, cùng khám phá những chi tiết thú vị nhất ngay từ những bước đầu tiên.`
        },
        {
          title: 'Bước 2: Tiếp cận mục tiêu & Khảo sát chi tiết',
          shotType: 'Medium Tracking Shot, Steadicam Flow',
          actionText: `bước đi chậm rãi, kiểm tra từng chi tiết quan trọng`,
          prompt: `Medium tracking Steadicam follow shot of ${characterName} walking steadily, examining key details with precision. ${characterOutfit}, ${artStyle}.`,
          voiceover: `Khi tiếp cận vào chi tiết, điều quan trọng nhất là sự tỉ mỉ và tập trung để không bỏ sót bất kỳ yếu tố nào.`
        },
        {
          title: 'Bước 3: Thực hiện thao tác then chốt',
          shotType: 'Close-Up Focus Shot, 60fps Slow Motion',
          actionText: `thực hiện thao tác chính xác và điêu luyện`,
          prompt: `Close-up shot of ${characterName} performing precise skillful actions. Soft depth of field, cinematic rim light, ${artStyle}.`,
          voiceover: `Bây giờ chúng ta tiến hành bước quan trọng nhất. Hãy theo dõi kỹ thao tác này để nắm được bí quyết cốt lõi nhé.`
        },
        {
          title: 'Bước 4: Biến chuyển bất ngờ & Đẩy cao trào',
          shotType: 'Dutch Angle Suspense, Dynamic Movement',
          actionText: `phản xạ nhanh nhạy trước sự thay đổi nhịp điệu`,
          prompt: `Dutch angle dynamic shot of ${characterName} reacting swiftly to shifting conditions. High energy, dramatic lighting, ${artStyle}.`,
          voiceover: `Tại thời điểm này, nhịp điệu bắt đầu tăng tốc và kết quả đang dần hiện rõ ngay trước mắt chúng ta.`
        },
        {
          title: 'Bước 5: Hoàn thiện & Kết thúc trọn vẹn',
          shotType: 'Epic Master Shot, Sunset Golden Hour',
          actionText: `hoàn thành xuất sắc nhiệm vụ và nở nụ cười tự tin`,
          prompt: `Epic master shot of ${characterName} standing victorious against golden sunset lighting. High aesthetic quality, 8k resolution, ${artStyle}.`,
          voiceover: `Và như vậy chúng ta đã hoàn thành xuất sắc toàn bộ quy trình ngày hôm nay. Cảm ơn các bạn đã theo dõi, chúc các bạn thực hiện thành công!`
        }
      ];
    }

    const scenes = [];
    const actualCount = Math.min(20, Math.max(5, count));

    for (let i = 0; i < actualCount; i++) {
      const template = templateScenes[i % templateScenes.length];
      const sceneNum = i + 1;

      scenes.push({
        id: 'scene_' + Date.now() + '_' + i,
        number: sceneNum,
        title: `Phân cảnh ${sceneNum}: ${template.title.replace(/^Bước \d+:\s*/, '')}`,
        shotType: template.shotType,
        actionText: template.actionText,
        prompt: template.prompt,
        voiceover: template.voiceover,
        voiceGender: 'Nam (Tiếng Việt)',
        duration: 6,
        aspectRatio: '16:9',
        referenceImage: null,
        status: 'idle',
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
    model = 'gemini-3.1-flash-lite',
    voiceGender = 'male_vi'
  }) {
    if (!apiKey) {
      return this.generateProceduralScenes({
        count,
        topic,
        characterName: characterProfile?.name || 'Đầu bếp',
        characterOutfit: characterProfile?.outfit || 'trang phục chuẩn mực',
        artStyle: characterProfile?.artStyle || 'Cinematic 4K Food Commercial',
        voiceGender
      });
    }

    const cleanModel = (model || '').replace(/^models\//, '');
    // Candidate models ordered by stability and speed in current Gemini environment
    const candidateModels = [
      cleanModel,
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.1-pro-preview',
      'gemini-flash-latest'
    ].filter(m => m && !m.includes('1.5') && !m.includes('2.5'));

    // Remove duplicates
    const uniqueModels = [...new Set(candidateModels)];

    const systemPrompt = `You are a world-class culinary director, video producer, and Vietnamese voiceover scriptwriter for Google Veo 3 / Google Flow video generation.
Your job is to generate exactly ${count} sequential video scenes with camera angles, visual prompts, and Vietnamese male voiceover narration based on the user's topic.

CRITICAL REQUIREMENTS:
1. If the topic is cooking / food (e.g., "dạy nấu món ăn canh chua cá kho tộ", or culinary tutorials):
   - Sequence every scene logically: Introduction of ingredients -> Preparation/chopping -> Marinating/seasoning -> Searing/frying -> Simmering/boiling -> Herb garnishing -> Final appetizing table presentation.
   - For EACH scene, write an engaging, warm, natural Vietnamese male voiceover ("voiceover") explaining the exact cooking tip and steps in friendly conversational Vietnamese (Giọng nam truyền cảm, gần gũi, hướng dẫn tận tình).
   - For EACH scene, write a detailed English cinematic visual prompt ("prompt") optimized for Veo 3 / Google Flow (mentioning 4K food commercial lighting, steam, bubbling sauce, fresh herbs, camera movements like macro close-up, flat lay, slow motion).
2. If the topic is a story or other genre:
   - Provide sequential storytelling with English Veo prompt and warm Vietnamese male voiceover narration for every scene.
3. You must return ONLY a valid JSON array of objects, with NO markdown backticks, NO commentary:
[
  {
    "number": 1,
    "title": "Tiêu đề phân cảnh bằng tiếng Việt (ngắn gọn, hấp dẫn)",
    "shotType": "Camera shot description in English/Vietnamese (e.g. Top-down Flat Lay 4K, Macro Close-Up)",
    "actionText": "Mô tả hành động nấu nướng hoặc diễn xuất bằng tiếng Việt",
    "prompt": "Highly detailed cinematic English prompt for Google Veo 3 with camera motion, lighting, appetizing details, and steam",
    "voiceover": "Đoạn lời thoại thuyết minh bằng tiếng Việt giọng nam truyền cảm (khoảng 2-3 câu ngắn tự nhiên, phù hợp thời lượng 5-8 giây)",
    "voiceGender": "Nam (Tiếng Việt)",
    "duration": 6,
    "aspectRatio": "16:9"
  }
]`;

    const userContent = `Chủ đề video: ${topic}
Thông tin nhân vật / người hướng dẫn:
- Tên: ${characterProfile?.name || 'Đầu bếp / Người dẫn'}
- Phong cách: ${characterProfile?.artStyle || 'Cinematic 4K Food Commercial, photorealistic, warm appetizing lighting'}
- Trang phục: ${characterProfile?.outfit || 'Tạp dề chuyên nghiệp'}

Hãy tạo đúng ${count} phân cảnh tuần tự với lời thuyết minh giọng nam tiếng Việt cho từng cảnh.`;

    for (const targetModel of uniqueModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;
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
          console.warn(`Model ${targetModel} error (${response.status}):`, data?.error?.message || response.statusText);
          continue; // Try next model candidate
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`✓ Tạo kịch bản thành công bằng AI model: ${targetModel} (${parsed.length} phân cảnh)`);
          return parsed.map((sc, index) => ({
            id: 'scene_' + Date.now() + '_' + index,
            number: sc.number || index + 1,
            title: sc.title || `Phân cảnh ${index + 1}`,
            shotType: sc.shotType || 'Cinematic Shot',
            actionText: sc.actionText || '',
            prompt: sc.prompt,
            voiceover: sc.voiceover || sc.narration || '',
            voiceGender: sc.voiceGender || 'Nam (Tiếng Việt)',
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
      } catch (err) {
        console.warn(`Candidate model ${targetModel} failed:`, err.message);
      }
    }

    console.warn('Tất cả AI models đều không khả dụng hoặc bị quá tải, tự động chuyển sang kịch bản mẫu chất lượng cao...');
    return this.generateProceduralScenes({
      count,
      topic,
      characterName: characterProfile?.name || 'Đầu bếp Hoàng',
      characterOutfit: characterProfile?.outfit || 'tạp dề bếp chuyên nghiệp',
      artStyle: characterProfile?.artStyle || 'Cinematic 4K Food Commercial',
      voiceGender
    });
  }
}

module.exports = new ScriptGenerator();
