import { Suspense } from 'react';
import { BookingForm } from '@/routes/BookingForm/BookingForm';

export default function Page() {
  return (
    <Suspense>
      <BookingForm />
    </Suspense>
  );
}
