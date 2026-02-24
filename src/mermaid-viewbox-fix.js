/**
 * Fix Mermaid SVG viewBox bug where height is calculated incorrectly,
 * causing massive whitespace below diagrams.
 * See: https://github.com/mermaid-js/mermaid/issues/1984
 *
 * Runs as a Docusaurus client module. Observes the DOM for Mermaid SVGs
 * and corrects their viewBox to match the actual rendered content bounds.
 */

function fixMermaidViewBox(svg) {
  // Measure all visible elements to find the true content bounds.
  // We can't rely on getBBox() alone because foreignObject HTML content
  // (used by htmlLabels) isn't included in SVG bounding box calculations.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  // Measure SVG elements (rects, paths, lines, circles, text)
  svg.querySelectorAll('rect, path, line, circle, ellipse, polygon, text').forEach(el => {
    try {
      const bbox = el.getBBox();
      if (bbox.width === 0 && bbox.height === 0) return;

      // Get the element's transform in SVG coordinate space
      const ctm = el.getCTM();
      const svgCtm = svg.getCTM();
      if (!ctm || !svgCtm) return;

      // Transform bbox corners to SVG root coordinate space
      const svgPoint = svg.createSVGPoint();
      const points = [
        { x: bbox.x, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      ];

      points.forEach(p => {
        svgPoint.x = p.x;
        svgPoint.y = p.y;
        const transformed = svgPoint.matrixTransform(ctm).matrixTransform(svgCtm.inverse());
        minX = Math.min(minX, transformed.x);
        minY = Math.min(minY, transformed.y);
        maxX = Math.max(maxX, transformed.x);
        maxY = Math.max(maxY, transformed.y);
      });
    } catch {
      // Skip elements that can't be measured
    }
  });

  if (!isFinite(minX)) return;

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  if (contentWidth <= 0 || contentHeight <= 0) return;

  // Check if the viewBox needs fixing
  const currentViewBox = svg.getAttribute('viewBox');
  if (!currentViewBox) return;

  const parts = currentViewBox.split(/\s+/).map(Number);
  const currentHeight = parts[3];

  // Only fix if viewBox height is significantly larger than content
  if (currentHeight <= contentHeight * 1.5) return;

  const padding = 25;
  svg.setAttribute('viewBox',
    `${minX - padding} ${minY - padding} ${contentWidth + padding * 2} ${contentHeight + padding * 2}`
  );
  svg.style.maxWidth = '';
}

function fixAllMermaidSvgs() {
  document.querySelectorAll('.docusaurus-mermaid-container svg').forEach(fixMermaidViewBox);
}

export function onRouteDidUpdate() {
  setTimeout(fixAllMermaidSvgs, 300);
  setTimeout(fixAllMermaidSvgs, 1000);
}
