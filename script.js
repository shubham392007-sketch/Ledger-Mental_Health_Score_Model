// ---------- Rough.js decorative elements ----------
  window.addEventListener('DOMContentLoaded', () => {

    if (typeof rough !== 'undefined') {
      try {
        // underline under "scored"
        const underlineSvg = document.getElementById('underline-svg');
        if (underlineSvg) {
          const rc1 = rough.svg(underlineSvg);
          underlineSvg.appendChild(rc1.line(4, 10, 214, 8, { stroke: '#111', strokeWidth: 3, roughness: 2.2 }));
        }

        // star doodle
        const star = document.getElementById('star-1');
        if (star) {
          const rc2 = rough.svg(star);
          const pts = [[17,2],[20,13],[32,13],[22,20],[26,32],[17,24],[8,32],[12,20],[2,13],[14,13]];
          star.appendChild(rc2.polygon(pts, { fill:'#111', fillStyle:'solid', stroke:'#111', roughness:1.6 }));
        }

        // scribble doodle
        const scribble = document.getElementById('scribble-1');
        if (scribble) {
          const rc3 = rough.svg(scribble);
          scribble.appendChild(rc3.curve([[2,20],[16,4],[30,24],[44,4],[58,18]], { stroke:'#111', strokeWidth:2.2, roughness:1.8 }));
        }

        // sparkle doodle
        const sparkle = document.getElementById('sparkle-1');
        if (sparkle) {
          const rc4 = rough.svg(sparkle);
          sparkle.appendChild(rc4.line(20, 2, 20, 38, { stroke: '#111', strokeWidth: 2, roughness: 1.5 }));
          sparkle.appendChild(rc4.line(2, 20, 38, 20, { stroke: '#111', strokeWidth: 2, roughness: 1.5 }));
          sparkle.appendChild(rc4.line(8, 8, 32, 32, { stroke: '#111', strokeWidth: 1.5, roughness: 1.4 }));
        }
      } catch (err) {
        console.warn('Rough.js initialization warning:', err);
      }
    }

    // hero notebook circle
    drawScoreCircle('hero-circle', 50, 50, 42, 1);

    // Try fetching dynamic options from FastAPI /options endpoint
    fetch(`${API_BASE}/options`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (data.countries) populateSelect('country', data.countries);
          if (data.platforms) populateSelect('most_used_platform', data.platforms);
        }
      })
      .catch(() => {
        // Fallback to static options if backend isn't reachable yet
        populateSelect('country', ['India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France','Other']);
        populateSelect('most_used_platform', ['Instagram','YouTube','TikTok','Facebook','WhatsApp','Snapchat','Twitter','LinkedIn','WeChat','LINE','KakaoTalk','VKontakte']);
      });
  });

  function populateSelect(id, values) {
    const el = document.getElementById(id);
    if (!el) return;
    const currentVal = el.value;
    // Only populate if select is empty or needs values
    if (el.options.length <= 1) {
      el.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join('');
    }
    if (currentVal && Array.from(el.options).some(o => o.value === currentVal)) {
      el.value = currentVal;
    }
  }


  function drawScoreCircle(svgId, cx, cy, r, fraction) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    svg.innerHTML = '';

    if (typeof rough === 'undefined') {
      const circleTrack = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleTrack.setAttribute('cx', cx); circleTrack.setAttribute('cy', cy); circleTrack.setAttribute('r', r);
      circleTrack.setAttribute('stroke', '#E6E6E6'); circleTrack.setAttribute('stroke-width', '3'); circleTrack.setAttribute('fill', 'none');
      svg.appendChild(circleTrack);

      const pathArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const angle = Math.max(0.08, Math.min(1, fraction)) * 360;
      pathArc.setAttribute('d', describeArc(cx, cy, r, -90, -90 + angle));
      pathArc.setAttribute('stroke', '#111'); pathArc.setAttribute('stroke-width', '3.5'); pathArc.setAttribute('fill', 'none');
      svg.appendChild(pathArc);
      return;
    }

    try {
      const rc = rough.svg(svg);
      // track
      svg.appendChild(rc.circle(cx, cy, r * 2, { stroke: '#E6E6E6', strokeWidth: 3, roughness: 1.4, fill: 'none' }));
      // progress arc
      const angle = Math.max(0.08, Math.min(1, fraction)) * 360;
      const path = describeArc(cx, cy, r, -90, -90 + angle);
      svg.appendChild(rc.path(path, { stroke: '#111', strokeWidth: 3.4, roughness: 1.7, fill: 'none' }));
    } catch (e) {
      console.warn('Fallback SVG circle:', e);
    }
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const a = (angleDeg - 90) * Math.PI / 180.0;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  }

  // ---------- Form submission ----------
  const API_BASE = (window.location.protocol.startsWith('http') && window.location.port !== '3000')
    ? window.location.origin
    : 'http://127.0.0.1:8000';


  const form = document.getElementById('predict-form');
  const submitBtn = document.getElementById('submit-btn');
  const spinner = document.getElementById('spinner');
  const submitLabel = document.getElementById('submit-label');
  const errMsg = document.getElementById('err-msg');
  const resultEl = document.getElementById('result');

  function val(id) { return document.getElementById(id).value; }
  function num(id) { return Number(document.getElementById(id).value); }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errMsg.style.display = 'none';

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = {
      age: num('age'),
      gender: val('gender'),
      country: val('country'),
      academic_level: val('academic_level'),
      most_used_platform: val('most_used_platform'),
      purpose_of_use: val('purpose_of_use'),
      avg_daily_usage_hours: num('avg_daily_usage_hours'),
      daily_unlocks: num('daily_unlocks'),
      study_hours: num('study_hours'),
      physical_activity_hours: num('physical_activity_hours'),
      sleep_hours_per_night: num('sleep_hours_per_night'),
      stress_level: val('stress_level')
    };

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server responded ${res.status}. ${text.slice(0, 180)}`);
      }

      const data = await res.json();
      showResult(data.predicted_mental_health_score);

    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    spinner.style.display = isLoading ? 'inline-block' : 'none';
    submitLabel.textContent = isLoading ? 'Crunching numbers…' : 'Calculate my score';
  }

  function showError(err) {
    let message = err.message || 'Something went wrong.';
    if (err instanceof TypeError) {
      message = `Couldn't reach the API at ${API_BASE}. Make sure your FastAPI server is running (uvicorn main:app --reload) and that CORS is enabled.`;
    }
    errMsg.textContent = message;
    errMsg.style.display = 'inline-block';
  }

  function showResult(score) {
    const clamped = Math.max(0, Math.min(10, score));
    document.getElementById('score-value').textContent = score.toFixed(1);
    drawScoreCircle('result-circle', 100, 100, 84, clamped / 10);

    let tag, heading, body;
    if (score >= 8) {
      tag = 'looking solid ✓';
      heading = 'Your predicted score is strong.';
      body = 'Your logged habits — sleep, activity, and stress balance — line up with the higher end of the training data.';
    } else if (score >= 6) {
      tag = 'steady ✓';
      heading = 'Your predicted score is in a healthy range.';
      body = 'Nothing alarming here. Small adjustments to sleep or screen time could nudge this further.';
    } else if (score >= 4) {
      tag = 'worth a look';
      heading = 'Your predicted score is on the lower side.';
      body = 'A few inputs — often sleep, stress, or study load — are pulling this down. Consider what might be adjustable.';
    } else {
      tag = 'take this seriously';
      heading = 'Your predicted score is low.';
      body = 'This estimate reflects a difficult pattern in your logged habits. If things feel heavy right now, please reach out to someone you trust or a mental health professional.';
    }
    document.getElementById('result-tag').textContent = tag;
    document.getElementById('result-heading').textContent = heading;
    document.getElementById('result-body').textContent = body;

    resultEl.classList.add('show');
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
