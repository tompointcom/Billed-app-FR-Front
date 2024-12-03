/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the new bill form should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html


      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeTruthy()
    })
    test("Then form submit and file change events should be attached", () => {
      document.body.innerHTML = `
        <form data-testid="form-new-bill">
          <input data-testid="file" type="file" />
        </form>
      `

      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document: document,
        onNavigate: onNavigate,
        store: null,
        localStorage: localStorageMock
      })

      const formNewBill = screen.getByTestId('form-new-bill')
      const fileInput = screen.getByTestId('file')

      expect(formNewBill.addEventListener).toHaveBeenCalledWith("submit", newBill.handleSubmit)
      expect(fileInput.addEventListener).toHaveBeenCalledWith("change", newBill.handleChangeFile)
    })
  })

})
