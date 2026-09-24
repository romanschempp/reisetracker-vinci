import { HashRouter, Route, Routes } from 'react-router';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EmployerFormPage } from '../features/employers/EmployerFormPage';
import { EmployersPage } from '../features/employers/EmployersPage';
import { PlacesPage } from '../features/places/PlacesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { WorkDaySheetProvider } from '../features/workdays/WorkDaySheetProvider';
import { WorkDaysPage } from '../features/workdays/WorkDaysPage';
import { Layout } from './Layout';

// HashRouter: funktioniert auf jedem statischen Host und offline ohne Server-Rewrites.
export function App() {
  return (
    <HashRouter>
      <WorkDaySheetProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tage" element={<WorkDaysPage />} />
            <Route path="arbeitgeber" element={<EmployersPage />} />
            <Route path="arbeitgeber/neu" element={<EmployerFormPage />} />
            <Route path="arbeitgeber/:id" element={<EmployerFormPage />} />
            <Route path="orte" element={<PlacesPage />} />
            <Route path="mehr" element={<SettingsPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Route>
        </Routes>
      </WorkDaySheetProvider>
    </HashRouter>
  );
}
