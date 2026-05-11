const elements = {
  density: document.getElementById("density"),
  width: document.getElementById("width"),
  length: document.getElementById("length"),
  height: document.getElementById("height"),
  pocketingEnabled: document.getElementById("pocketing-enabled"),
  bottomThickness: document.getElementById("bottom-thickness"),
  ribThickness: document.getElementById("rib-thickness"),
  pocketsWidth: document.getElementById("pockets-width"),
  pocketsLength: document.getElementById("pockets-length"),
  marginWidth: document.getElementById("margin-width"),
  marginLength: document.getElementById("margin-length"),
  mass: document.getElementById("mass"),
  removedMass: document.getElementById("removed-mass"),
  totalMass: document.getElementById("total-mass"),
  materialInfo: document.getElementById("material-info"),
  volume: document.getElementById("volume"),
  pocketSummary: document.getElementById("pocket-summary"),
  warning: document.getElementById("warning"),
  dimensions: document.getElementById("dimensions"),
  faceTop: document.getElementById("face-top"),
  faceLeft: document.getElementById("face-left"),
  faceRight: document.getElementById("face-right"),
  edgeFront: document.getElementById("edge-front"),
  edgeBack: document.getElementById("edge-back"),
  edgeBottomLeft: document.getElementById("edge-bottom-left"),
  edgeBottomRight: document.getElementById("edge-bottom-right"),
  pocketGroup: document.getElementById("pocket-group"),
  widthLine: document.getElementById("dim-width-line"),
  lengthLine: document.getElementById("dim-length-line"),
  heightLine: document.getElementById("dim-height-line"),
  widthText: document.getElementById("dim-width-text"),
  lengthText: document.getElementById("dim-length-text"),
  heightText: document.getElementById("dim-height-text")
};

const svgOrigin = { x: 234, y: 192 };
const pocketInputs = [
  elements.bottomThickness,
  elements.ribThickness,
  elements.pocketsWidth,
  elements.pocketsLength,
  elements.marginWidth,
  elements.marginLength
];

function toPositiveNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function projectPoint(x, y, z) {
  const isoX = svgOrigin.x + (x - y) * 0.86;
  const isoY = svgOrigin.y + (x + y) * 0.42 - z;
  return { x: isoX, y: isoY };
}

function pointsToAttribute(points) {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}

function setLine(line, start, end) {
  line.setAttribute("x1", start.x.toFixed(2));
  line.setAttribute("y1", start.y.toFixed(2));
  line.setAttribute("x2", end.x.toFixed(2));
  line.setAttribute("y2", end.y.toFixed(2));
}

function setText(textNode, point, value) {
  textNode.setAttribute("x", point.x.toFixed(2));
  textNode.setAttribute("y", point.y.toFixed(2));
  textNode.textContent = value;
}

function setPocketInputsEnabled(enabled) {
  pocketInputs.forEach((input) => {
    input.disabled = !enabled;
  });
}

function clearPockets() {
  elements.pocketGroup.replaceChildren();
}

function buildPocketLayout(widthMm, lengthMm, heightMm) {
  const bottomThickness = toPositiveNumber(elements.bottomThickness.value);
  const ribThickness = toPositiveNumber(elements.ribThickness.value);
  const pocketsAlongWidth = toPositiveInteger(elements.pocketsWidth.value);
  const pocketsAlongLength = toPositiveInteger(elements.pocketsLength.value);
  const marginWidth = toPositiveNumber(elements.marginWidth.value);
  const marginLength = toPositiveNumber(elements.marginLength.value);

  const warnings = [];

  if (bottomThickness >= heightMm) {
    warnings.push("Bottom thickness must be smaller than the plate height.");
  }

  if (pocketsAlongWidth === 0 || pocketsAlongLength === 0) {
    warnings.push("Pocket counts along width and length must both be at least 1.");
  }

  const usableWidth = widthMm - marginWidth * 2;
  const usableLength = lengthMm - marginLength * 2;

  if (usableWidth <= 0 || usableLength <= 0) {
    warnings.push("Keep-out widths leave no usable area for pocketing.");
  }

  const pocketWidth =
    pocketsAlongWidth > 0
      ? (usableWidth - ribThickness * (pocketsAlongWidth - 1)) / pocketsAlongWidth
      : -1;
  const pocketLength =
    pocketsAlongLength > 0
      ? (usableLength - ribThickness * (pocketsAlongLength - 1)) / pocketsAlongLength
      : -1;

  if (pocketWidth <= 0 || pocketLength <= 0) {
    warnings.push("Pocket count, rib thickness, and keep-out widths do not fit within the plate.");
  }

  if (warnings.length > 0) {
    return {
      isValid: false,
      warnings,
      bottomThickness,
      ribThickness,
      pocketsAlongWidth,
      pocketsAlongLength,
      marginWidth,
      marginLength
    };
  }

  return {
    isValid: true,
    warnings,
    bottomThickness,
    ribThickness,
    pocketsAlongWidth,
    pocketsAlongLength,
    marginWidth,
    marginLength,
    usableWidth,
    usableLength,
    pocketWidth,
    pocketLength,
    pocketDepth: heightMm - bottomThickness
  };
}

function drawPockets(layout, scale, plateHeightScaled) {
  clearPockets();

  if (!layout?.isValid) {
    return;
  }

  for (let widthIndex = 0; widthIndex < layout.pocketsAlongWidth; widthIndex += 1) {
    const xStartMm =
      layout.marginWidth + widthIndex * (layout.pocketWidth + layout.ribThickness);

    for (let lengthIndex = 0; lengthIndex < layout.pocketsAlongLength; lengthIndex += 1) {
      const yStartMm =
        layout.marginLength + lengthIndex * (layout.pocketLength + layout.ribThickness);

      const x0 = xStartMm * scale;
      const x1 = (xStartMm + layout.pocketWidth) * scale;
      const y0 = yStartMm * scale;
      const y1 = (yStartMm + layout.pocketLength) * scale;

      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute(
        "points",
        pointsToAttribute([
          projectPoint(x0, y0, plateHeightScaled),
          projectPoint(x1, y0, plateHeightScaled),
          projectPoint(x1, y1, plateHeightScaled),
          projectPoint(x0, y1, plateHeightScaled)
        ])
      );

      elements.pocketGroup.appendChild(polygon);
    }
  }
}

function updateView() {
  const density = toPositiveNumber(elements.density.value);
  const selectedLabel = elements.density.options[elements.density.selectedIndex].text;
  const materialName = selectedLabel.split(" (")[0];
  const widthMm = toPositiveNumber(elements.width.value);
  const lengthMm = toPositiveNumber(elements.length.value);
  const heightMm = toPositiveNumber(elements.height.value);
  const pocketingEnabled = elements.pocketingEnabled.checked;

  setPocketInputsEnabled(pocketingEnabled);

  const totalVolumeCm3 = (widthMm * lengthMm * heightMm) / 1000;
  const totalMassKg = (density * totalVolumeCm3) / 1000;

  let removedVolumeCm3 = 0;
  let removedMassKg = 0;
  let remainingMassKg = totalMassKg;
  let pocketSummary = "Pocketing disabled";
  let warningMessage = "";

  let pocketLayout = null;

  if (pocketingEnabled) {
    pocketLayout = buildPocketLayout(widthMm, lengthMm, heightMm);

    if (pocketLayout.isValid) {
      removedVolumeCm3 =
        (pocketLayout.pocketWidth *
          pocketLayout.pocketLength *
          pocketLayout.pocketDepth *
          pocketLayout.pocketsAlongWidth *
          pocketLayout.pocketsAlongLength) /
        1000;
      removedMassKg = (density * removedVolumeCm3) / 1000;
      remainingMassKg = totalMassKg - removedMassKg;
      pocketSummary =
        `${pocketLayout.pocketsAlongWidth} x ${pocketLayout.pocketsAlongLength} pockets` +
        ` | Pocket size: ${pocketLayout.pocketWidth.toFixed(1)} x ${pocketLayout.pocketLength.toFixed(1)} mm` +
        ` | Depth: ${pocketLayout.pocketDepth.toFixed(1)} mm`;
    } else {
      warningMessage = pocketLayout.warnings.join(" ");
      pocketSummary = "Pocketing inputs need adjustment";
    }
  }

  elements.mass.textContent = remainingMassKg.toFixed(3);
  elements.removedMass.textContent = `Removed Mass: ${removedMassKg.toFixed(3)} kg`;
  elements.totalMass.textContent = `Total Mass: ${totalMassKg.toFixed(3)} kg`;
  elements.materialInfo.textContent = `${materialName} | Density: ${density.toFixed(3)} g/cm3`;
  elements.volume.textContent = `Total Volume: ${totalVolumeCm3.toFixed(3)} cm3 | Removed Volume: ${removedVolumeCm3.toFixed(3)} cm3`;
  elements.pocketSummary.textContent = pocketSummary;
  elements.warning.textContent = warningMessage;
  elements.dimensions.textContent = `W ${widthMm.toFixed(1)} mm / L ${lengthMm.toFixed(1)} mm / H ${heightMm.toFixed(1)} mm`;

  const maxDimension = Math.max(widthMm, lengthMm, heightMm, 1);
  const scale = 220 / maxDimension;
  const width = widthMm * scale;
  const length = lengthMm * scale;
  const height = Math.max(heightMm * scale, 6);

  const topFrontLeft = projectPoint(0, 0, height);
  const topFrontRight = projectPoint(width, 0, height);
  const topBackLeft = projectPoint(0, length, height);
  const topBackRight = projectPoint(width, length, height);
  const bottomFrontLeft = projectPoint(0, 0, 0);
  const bottomFrontRight = projectPoint(width, 0, 0);
  const bottomBackLeft = projectPoint(0, length, 0);
  const bottomBackRight = projectPoint(width, length, 0);

  elements.faceTop.setAttribute(
    "points",
    pointsToAttribute([topFrontLeft, topFrontRight, topBackRight, topBackLeft])
  );
  elements.faceLeft.setAttribute(
    "points",
    pointsToAttribute([topFrontLeft, topBackLeft, projectPoint(0, length, 0), bottomFrontLeft])
  );
  elements.faceRight.setAttribute(
    "points",
    pointsToAttribute([topFrontRight, topBackRight, bottomBackRight, bottomFrontRight])
  );

  setLine(elements.edgeFront, bottomFrontLeft, bottomFrontRight);
  setLine(elements.edgeBack, bottomBackLeft, bottomBackRight);
  setLine(elements.edgeBottomLeft, bottomFrontLeft, bottomBackLeft);
  setLine(elements.edgeBottomRight, bottomFrontRight, bottomBackRight);

  const widthStart = { x: topFrontLeft.x, y: topFrontLeft.y - 26 };
  const widthEnd = { x: topFrontRight.x, y: topFrontRight.y - 26 };
  setLine(elements.widthLine, widthStart, widthEnd);
  setText(
    elements.widthText,
    { x: (widthStart.x + widthEnd.x) / 2, y: (widthStart.y + widthEnd.y) / 2 - 6 },
    `W ${widthMm.toFixed(1)} mm`
  );

  const lengthStart = { x: topBackLeft.x - 28, y: topBackLeft.y };
  const lengthEnd = { x: topFrontLeft.x - 28, y: topFrontLeft.y };
  setLine(elements.lengthLine, lengthStart, lengthEnd);
  setText(
    elements.lengthText,
    { x: (lengthStart.x + lengthEnd.x) / 2 - 24, y: (lengthStart.y + lengthEnd.y) / 2 - 2 },
    `L ${lengthMm.toFixed(1)} mm`
  );

  const heightStart = { x: bottomFrontRight.x + 28, y: bottomFrontRight.y };
  const heightEnd = { x: topFrontRight.x + 28, y: topFrontRight.y };
  setLine(elements.heightLine, heightStart, heightEnd);
  setText(
    elements.heightText,
    { x: heightEnd.x + 18, y: (heightStart.y + heightEnd.y) / 2 + 4 },
    `H ${heightMm.toFixed(1)} mm`
  );

  if (pocketingEnabled && pocketLayout?.isValid) {
    drawPockets(pocketLayout, scale, height);
  } else {
    clearPockets();
  }
}

document.getElementById("plate-form").addEventListener("input", updateView);
updateView();
