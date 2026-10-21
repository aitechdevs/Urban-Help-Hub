<?php

namespace Tests\Feature;

use App\Providers\BrandedMailServiceProvider;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class BrandedMailTest extends TestCase
{
    public function test_plain_reset_email_preserves_token_and_text_and_embeds_logo_once(): void
    {
        $this->assertNotNull($this->app->getProvider(BrandedMailServiceProvider::class));
        $text = "Reset: https://urbanhelphub.com/reset-password/#token=test-token&email=person%40example.test\n<unsafe>";
        $email = (new Email)->from('sender@example.test')->to('person@example.test')->subject('Reset')->text($text);
        Event::dispatch(new MessageSending($email));
        Event::dispatch(new MessageSending($email));
        $this->assertSame($text, $email->getTextBody());
        $this->assertSame('Reset', $email->getSubject());
        $this->assertSame('person@example.test', $email->getTo()[0]->getAddress());
        $this->assertStringContainsString('href="https://urbanhelphub.com/reset-password/#token=test-token&amp;email=person%40example.test"', $email->getHtmlBody());
        $this->assertStringContainsString('&lt;unsafe&gt;', $email->getHtmlBody());
        $this->assertSame(1, substr_count($email->getHtmlBody(), 'alt="UrbanHelpHub"'));
        $this->assertCount(1, $email->getAttachments());
        $this->assertStringContainsString('Content-Disposition: inline', $email->toString());
        $this->assertStringContainsString('Content-Type: image/png', $email->toString());
    }

    public function test_existing_html_body_is_retained_with_one_logo_inside_body(): void
    {
        $email = (new Email)->from('sender@example.test')->to('person@example.test')
            ->html('<html><body><p>Existing approval details</p></body></html>')->text('Original alternative');
        Event::dispatch(new MessageSending($email));
        $this->assertStringContainsString('<body><div', $email->getHtmlBody());
        $this->assertStringContainsString('<p>Existing approval details</p>', $email->getHtmlBody());
        $this->assertSame('Original alternative', $email->getTextBody());
        $this->assertSame(1, substr_count($email->getHtmlBody(), 'alt="UrbanHelpHub"'));
    }
}
