import { projectRegistry } from "@/project/projectRegistry";
import { ProjectManagementDashboard } from "@/components/dashboard/ProjectManagementDashboard";

export default function ProjectManagement() {
  const registry = projectRegistry;
  return <ProjectManagementDashboard registry={registry} />;
}
