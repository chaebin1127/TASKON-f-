const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;

function send(res, status, payload) {
  return res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "POST 요청만 허용됩니다." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 500, { error: "서버에 GEMINI_API_KEY 환경 변수가 설정되지 않았습니다." });
  }

  try {
    const { task, prompt, image } = req.body || {};
    const allowed = new Set(["image", "steps", "today"]);
    if (!allowed.has(task)) return send(res, 400, { error: "지원하지 않는 AI 작업입니다." });
    if (typeof prompt !== "string" || prompt.length < 2 || prompt.length > 12000) {
      return send(res, 400, { error: "요청 내용이 비어 있거나 너무 깁니다." });
    }

    let imagePart;
    if (task === "image") {
      const match = typeof image === "string" && image.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
      if (!match || image.length > MAX_IMAGE_DATA_URL_LENGTH) {
        return send(res, 400, { error: "지원되는 이미지(JPEG, PNG, WebP)를 업로드해 주세요. 이미지 크기를 줄여 다시 시도해 주세요." });
      }
      imagePart = {
        inline_data: {
          mime_type: match[1] === "jpg" ? "image/jpeg" : `image/${match[1]}`,
          data: match[2]
        }
      };
    }

    const instructions = {
      image: "대학생 과제 공지 이미지에서 실제로 보이는 정보만 추출합니다. JSON 객체 {\"name\":\"과제명\",\"due\":\"YYYY-MM-DDTHH:mm\",\"submit\":\"제출 방식\",\"desc\":\"설명\"}로 반환하세요. 확인할 수 없는 값은 빈 문자열로 둡니다. 날짜와 시간은 절대 추측하지 마세요.",
      steps: "대학생 과제를 실행 가능한 순서의 3~6개 세부 단계로 나눕니다. JSON 객체 {\"steps\":[{\"t\":\"짧은 제목\",\"d\":\"구체적인 설명\",\"m\":예상 소요 분 정수}]} 형식으로 반환하세요.",
      today: "대학생의 오늘 학습 코치입니다. 제공된 과제와 단계 데이터만 사용하고 마감일, 중요도, 미완료 상태를 고려해 오늘 할 일 3~5개를 고르세요. JSON 객체 {\"summary\":\"오늘 계획 요약\",\"picks\":[{\"id\":\"과제 id\",\"i\":단계 번호,\"why\":\"추천 이유\"}]} 형식으로 반환하세요. 존재하지 않는 과제 ID나 단계 번호를 만들지 마세요."
    };

    const parts = [{ text: instructions[task] + "\n\n" + prompt }];
    if (imagePart) parts.push(imagePart);

    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 1400,
          temperature: 0.2
        }
      })
    });

    const result = await upstream.json();
    if (!upstream.ok) {
      console.error("Gemini API error:", result);
      if (upstream.status === 429) return send(res, 429, { error: "Gemini 무료 사용 한도에 도달했어요. 잠시 후 다시 시도해 주세요." });
      if (upstream.status === 400 || upstream.status === 404) return send(res, 502, { error: "Gemini 요청 형식이나 모델 설정을 확인해 주세요." });
      return send(res, 502, { error: "Gemini AI 요청에 실패했어요. API 키와 모델 설정을 확인해 주세요." });
    }

    const output = (result.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("\n").trim();
    if (!output) return send(res, 502, { error: "AI가 비어 있는 응답을 반환했어요." });
    let parsed;
    try { parsed = JSON.parse(output); }
    catch { return send(res, 502, { error: "AI 응답을 JSON으로 읽지 못했어요." }); }
    return send(res, 200, parsed);
  } catch (error) {
    console.error("AI function error:", error);
    return send(res, 500, { error: "서버에서 AI 요청을 처리하지 못했습니다." });
  }
};
