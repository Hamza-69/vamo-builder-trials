/**
 * Stub for AI-generated listing descriptions.
 * In the future, this will call an AI model to generate a description
 * based on project data and activity timeline.
 */
export function generateListingDescription(
  projectName: string,
  projectDescription?: string | null,
): string {
  return `${projectName} is a promising project ${
    projectDescription
      ? `focused on ${projectDescription}`
      : "with strong growth potential"
  }. This listing represents an exciting opportunity to acquire a vetted, early-stage project with demonstrated traction and progress. The project has been actively developed with consistent milestones and validated through the Vamo platform.`;
}
