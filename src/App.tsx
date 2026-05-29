import { useEffect, useState } from 'react';
import { projectRepository } from './data';
import type { Project } from './types';
import styles from './App.module.css';

export function App() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    let active = true;
    projectRepository.listProjects().then((p) => {
      if (active) setProjects(p);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>CampAwayDesign</h1>
        <p className={styles.subtitle}>
          Affordable, SUV-towable tiny homes — from brief to approved floorplan.
        </p>
      </header>

      {projects === null ? (
        <p className={styles.meta}>Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className={styles.meta}>No projects yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {projects.map((project) => (
            <li key={project.id} className={styles.card}>
              <h2 className={styles.cardTitle}>
                {project.clientName}
                <span className={styles.status}>{project.status.replace('_', ' ')}</span>
              </h2>
              <p className={styles.meta}>
                {project.brief.trailerLengthFt} ft · sleeps {project.brief.sleeps} · $
                {project.brief.budgetUsd.toLocaleString()} · {project.floorplans.length}{' '}
                floorplan version(s)
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
