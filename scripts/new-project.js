import fs from 'fs';
import path from 'path';

// Logic: Take the name from the command line (e.g., node scripts/new-project.js "Neural Ethics")
const projectName = process.argv[2] || 'new-project';
const slug = projectName.toLowerCase().replace(/ /g, '-');
const date = new Date().toISOString().split('T')[0];

const template = `---
title: "${projectName}"
description: "Brief summary of the inquiry."
date: ${date}
status: "seedling"
featured: false
tags: ["Philosophy"]
topics: []
related: []
---

import Section from '../../components/Section.astro';

<Section type="think" title="The Concept">
  Initial philosophical inquiry goes here.
</Section>

<Section type="do" title="The Execution">
  Technical implementation details go here.
</Section>
`;

const dir = './src/content/projects';
const filePath = path.join(dir, `${slug}.mdx`);

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(filePath, template);
console.log(`KERNEL_LOG: Node created at ${filePath}`);