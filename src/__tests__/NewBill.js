/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let newBill;
    let onNavigateMock;
    const store = {
      bills: () => ({
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      }),
    };

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ email: 'employee@test.com' }));

      onNavigateMock = jest.fn();

      // Initialize NewBill
      newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: store,
        localStorage: window.localStorage,
      });

      // Mock updateBill
      newBill.updateBill = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
      window.localStorage.clear();
    });

    test("Then handleSubmit should call updateBill and onNavigate with correct arguments", async () => {
      // Fill the form
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } });
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Vol Paris Londres' } });
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '348' } });
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2023-10-10' } });
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '70' } });
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '20' } });
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Voyage d\'affaires' } });

      // Set file properties
      newBill.fileUrl = 'https://example.com/file.jpg';
      newBill.fileName = 'file.jpg';

      console.log("localStorage content:", window.localStorage.getItem('user'));

      // Submit the form
      const form = screen.getByTestId('form-new-bill');
      fireEvent.submit(form);

      // Expected bill object
      const expectedBill = {
        email: 'employee@test.com',
        type: 'Transports',
        name: 'Vol Paris Londres',
        amount: 348,
        date: '2023-10-10',
        vat: '70',
        pct: 20,
        commentary: 'Voyage d\'affaires',
        fileUrl: 'https://example.com/file.jpg',
        fileName: 'file.jpg',
        status: 'pending',
      };
      await new Promise(resolve => setTimeout(resolve, 0));
      fireEvent.submit(form);

      // Assert updateBill was called with the expected bill
      expect(newBill.updateBill).toHaveBeenCalledWith(expectedBill);

      // Assert onNavigate was called with the correct route
      expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  });
});
