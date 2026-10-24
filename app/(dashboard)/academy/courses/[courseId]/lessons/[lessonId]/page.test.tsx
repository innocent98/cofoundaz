import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  saveProgress: vi.fn(),
  updateProfileName: vi.fn(),
  me: null as unknown,
  setMe: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'c1', lessonId: 'c1-3' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ href, children, ...r }: { href: string; children: React.ReactNode }) => <a href={href} {...r}>{children}</a> }));
vi.mock('../../../../ToastContext', () => ({ useToast: () => ({ triggerToast: vi.fn() }) }));
vi.mock('@/components/workspace-context', () => ({ useWorkspace: () => ({ me: h.me, loading: false, setMe: h.setMe }) }));
vi.mock('@/components/academy/note-editor', () => ({ NoteEditor: () => null }));
vi.mock('@/lib/api/learning', async (orig) => ({ ...(await orig<typeof import('@/lib/api/learning')>()), saveProgress: h.saveProgress }));
vi.mock('@/lib/api/profile', async (orig) => ({ ...(await orig<typeof import('@/lib/api/profile')>()), updateProfileName: h.updateProfileName }));
vi.mock('@/hooks/useLearning', () => ({
  useCourse: () => ({
    status: 'ready',
    error: null,
    reload: vi.fn(),
    data: {
      id: 'c1', title: 'Scope the MVP', summary: '', level: 'beginner', stage_tags: [], lesson_count: 3, duration_min: 30,
      review_status: 'draft', enrolled: true, progress: 66, completed: false, last_lesson_id: 'c1-2', next_lesson_id: 'c1-3', position_s: 0,
      description: '', outcomes: [],
      lessons: [1, 2, 3].map((n) => ({ id: `c1-${n}`, title: `Lesson ${n}`, order: n, duration_min: 10, video: null, transcript: 'Body', completed: n < 3, position_s: 0 })),
    },
  }),
}));

import LessonPage from './page';

const meWith = (name: string | null) => ({
  user: { id: 'u', email: 'placeholder@example.com' },
  profile: { full_name: name, role_title: null, country: null, avatar_url: null },
  memberships: [],
  active_workspace_id: null,
});
const cert = { id: 'x', course_id: 'c1', course_title: 'Scope the MVP', holder_name: 'Rewalk Teammate', credential_id: 'CFZ-AAAA-BBBB-CCCC', issuer: 'Cofoundaz', issued_at: '2026-10-24T10:00:00+00:00', verify_url: 'http://localhost:3000/verify/CFZ-AAAA-BBBB-CCCC', pdf_ready: false, pdf_url: null, linkedin_url: 'https://www.linkedin.com/profile/add' };

describe('lesson page: name before the certificate', () => {
  beforeEach(() => {
    h.saveProgress.mockReset().mockResolvedValue({ lesson_id: 'c1-3', course_id: 'c1', progress: 100, completed_at: 'x', position_s: null, certificate: cert });
    h.updateProfileName.mockReset();
    h.setMe.mockReset();
  });

  it('asks for a name before completing the last lesson when the profile has none', async () => {
    h.me = meWith(null);
    h.updateProfileName.mockResolvedValue(meWith('Rewalk Teammate'));
    render(<LessonPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(screen.getByText('Add your name before you finish')).toBeInTheDocument();
    expect(h.saveProgress).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Rewalk Teammate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save name and finish course' }));
    await waitFor(() => expect(h.saveProgress).toHaveBeenCalledWith('c1-3', { completed: true }));
    expect(h.setMe).toHaveBeenCalledWith(meWith('Rewalk Teammate'));
    expect(await screen.findByText('Course complete')).toBeInTheDocument();
  });

  it('a null profile is asked too; Not now leaves the lesson incomplete', () => {
    h.me = { ...meWith(null), profile: null };
    render(<LessonPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByText('Add your name before you finish')).toBeNull();
    expect(h.saveProgress).not.toHaveBeenCalled();
  });

  it('does not ask when the name is already set', async () => {
    h.me = meWith('Ada Founder');
    render(<LessonPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));
    await waitFor(() => expect(h.saveProgress).toHaveBeenCalled());
    expect(screen.queryByText('Add your name before you finish')).toBeNull();
  });
});
